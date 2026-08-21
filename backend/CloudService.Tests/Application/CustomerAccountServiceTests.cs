using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Moq;

namespace CloudService.Tests.Application;

public class CustomerAccountServiceTests
{
    private readonly Mock<IRepository<AppUser>> _users = new();
    private readonly Mock<IRepository<OrderRequest>> _orders = new();
    private readonly Mock<IRepository<ContactRequest>> _contacts = new();
    private readonly Mock<IRepository<AffiliateApplication>> _affiliates = new();
    private readonly Mock<IRepository<ServicePlan>> _plans = new();
    private readonly Mock<INotificationService> _notifications = new();

    public CustomerAccountServiceTests()
    {
        _orders.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(Array.Empty<OrderRequest>());
        _contacts.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(Array.Empty<ContactRequest>());
        _affiliates.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(Array.Empty<AffiliateApplication>());
        _plans.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(Array.Empty<ServicePlan>());
        _notifications.Setup(service => service.GetUnreadCountAsync(It.IsAny<Guid>()))
            .ReturnsAsync(0);
    }

    [Fact]
    public async Task GetRequestsAsync_ReturnsOnlyRequestsMatchingAccountEmail()
    {
        var user = CreateUser("customer@example.com");
        var plan = new ServicePlan { Name = "VPS Pro" };

        _users.Setup(repository => repository.GetByIdAsync(user.Id)).ReturnsAsync(user);
        _plans.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[] { plan });
        _orders.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            new OrderRequest
            {
                Email = "CUSTOMER@example.com",
                CustomerName = "Customer",
                PhoneNumber = "0900000000",
                BillingCycle = "Monthly",
                ServicePlanId = plan.Id,
                Status = OrderStatus.Processing
            },
            new OrderRequest
            {
                Email = "other@example.com",
                CustomerName = "Other",
                PhoneNumber = "0900000001",
                BillingCycle = "Monthly",
                ServicePlanId = plan.Id,
                Status = OrderStatus.New
            }
        });

        var result = await CreateService().GetRequestsAsync(user.Id);

        var item = Assert.Single(result);
        Assert.Equal("Order", item.RequestType);
        Assert.Equal("VPS Pro", item.Title);
        Assert.Equal("Processing", item.Status);
    }

    [Fact]
    public async Task GetRequestsAsync_IncludesHistoricalRequestsWithSameEmail()
    {
        var user = CreateUser("history@example.com");
        _users.Setup(repository => repository.GetByIdAsync(user.Id)).ReturnsAsync(user);
        _contacts.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            new ContactRequest
            {
                Email = user.Email,
                FullName = "History User",
                Subject = "Hỗ trợ",
                Message = "Test",
                Status = "Resolved"
            }
        });
        _affiliates.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            new AffiliateApplication
            {
                Email = user.Email,
                FullName = "History User",
                PhoneNumber = "0900000000",
                Status = "Processing"
            }
        });

        var result = await CreateService().GetRequestsAsync(user.Id);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, item => item.RequestType == "Contact");
        Assert.Contains(result, item => item.RequestType == "Affiliate");
    }

    [Fact]
    public async Task GetOverviewAsync_ReturnsCountsAndUnreadNotifications()
    {
        var user = CreateUser("overview@example.com");
        _users.Setup(repository => repository.GetByIdAsync(user.Id)).ReturnsAsync(user);
        _contacts.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            new ContactRequest
            {
                Email = user.Email,
                FullName = user.FullName,
                Subject = "Một",
                Message = "Test",
                Status = "New"
            },
            new ContactRequest
            {
                Email = user.Email,
                FullName = user.FullName,
                Subject = "Hai",
                Message = "Test",
                Status = "Resolved"
            }
        });
        _notifications.Setup(service => service.GetUnreadCountAsync(user.Id)).ReturnsAsync(3);

        var result = await CreateService().GetOverviewAsync(user.Id);

        Assert.Equal(2, result.TotalRequests);
        Assert.Equal(1, result.ActiveRequests);
        Assert.Equal(1, result.CompletedRequests);
        Assert.Equal(3, result.UnreadNotifications);
        Assert.Equal(user.Email, result.Profile.Email);
    }

    [Fact]
    public async Task GetOverviewAsync_WithManagementRole_IsRejected()
    {
        var admin = CreateUser("admin@example.com");
        admin.Role = AppRoles.Admin;
        _users.Setup(repository => repository.GetByIdAsync(admin.Id)).ReturnsAsync(admin);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => CreateService().GetOverviewAsync(admin.Id));
    }

    private static AppUser CreateUser(string email) => new()
    {
        FullName = "Customer",
        Email = email,
        Role = AppRoles.User,
        IsActive = true
    };

    private CustomerAccountService CreateService() => new(
        _users.Object,
        _orders.Object,
        _contacts.Object,
        _affiliates.Object,
        _plans.Object,
        _notifications.Object);
}
