using CloudService.Application.DTOs.RequestTracking;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Moq;

namespace CloudService.Tests.Application;

public class RequestTrackingServiceTests
{
    private readonly Mock<IRepository<OrderRequest>> _orders = new();
    private readonly Mock<IRepository<AffiliateApplication>> _affiliates = new();
    private readonly Mock<IRepository<ContactRequest>> _contacts = new();
    private readonly Mock<IRepository<ServicePlan>> _plans = new();

    public RequestTrackingServiceTests()
    {
        _orders.Setup(r => r.GetAllAsync()).ReturnsAsync(Array.Empty<OrderRequest>());
        _affiliates.Setup(r => r.GetAllAsync()).ReturnsAsync(Array.Empty<AffiliateApplication>());
        _contacts.Setup(r => r.GetAllAsync()).ReturnsAsync(Array.Empty<ContactRequest>());
    }

    [Fact]
    public async Task LookupAsync_WithCorrectOrderCodeAndEmail_ReturnsOrder()
    {
        var plan = new ServicePlan { Name = "VPS Pro" };
        var order = new OrderRequest
        {
            ReferenceCode = "ORD-20260821-ABC234",
            Email = "customer@example.com",
            CustomerName = "Customer",
            PhoneNumber = "0900000000",
            BillingCycle = "Yearly",
            Status = OrderStatus.Processing,
            ServicePlanId = plan.Id
        };
        _orders.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { order });
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);

        var result = await CreateService().LookupAsync(new RequestTrackingLookupDto
        {
            ReferenceCode = " ord-20260821-abc234 ",
            Email = " CUSTOMER@example.com "
        });

        Assert.NotNull(result);
        Assert.Equal("Order", result!.RequestType);
        Assert.Equal("Processing", result.Status);
        Assert.Equal("VPS Pro", result.Title);
    }

    [Fact]
    public async Task LookupAsync_WithWrongEmail_ReturnsNull()
    {
        _contacts.Setup(r => r.GetAllAsync()).ReturnsAsync(new[]
        {
            new ContactRequest
            {
                ReferenceCode = "CON-20260821-ABC234",
                Email = "owner@example.com",
                FullName = "Owner",
                Subject = "Support",
                Message = "Help"
            }
        });

        var result = await CreateService().LookupAsync(new RequestTrackingLookupDto
        {
            ReferenceCode = "CON-20260821-ABC234",
            Email = "attacker@example.com"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task LookupAsync_WithContactCode_ReturnsContact()
    {
        var contact = new ContactRequest
        {
            ReferenceCode = "CON-20260821-ABC234",
            Email = "contact@example.com",
            FullName = "Contact",
            Subject = "Tư vấn Cloud",
            Message = "Hello",
            Status = "Resolved"
        };
        _contacts.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { contact });

        var result = await CreateService().LookupAsync(new RequestTrackingLookupDto
        {
            ReferenceCode = contact.ReferenceCode,
            Email = contact.Email
        });

        Assert.NotNull(result);
        Assert.Equal("Contact", result!.RequestType);
        Assert.Equal("Resolved", result.Status);
        Assert.Equal("Tư vấn Cloud", result.Title);
    }

    [Fact]
    public async Task LookupAsync_WithAffiliateCode_ReturnsAffiliate()
    {
        var affiliate = new AffiliateApplication
        {
            ReferenceCode = "AFF-20260821-ABC234",
            Email = "partner@example.com",
            FullName = "Partner",
            PhoneNumber = "0900000000",
            CompanyName = "Partner Co",
            Status = "Processing"
        };
        _affiliates.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { affiliate });

        var result = await CreateService().LookupAsync(new RequestTrackingLookupDto
        {
            ReferenceCode = affiliate.ReferenceCode,
            Email = affiliate.Email
        });

        Assert.NotNull(result);
        Assert.Equal("Affiliate", result!.RequestType);
        Assert.Equal("Partner Co", result.Subtitle);
    }

    [Fact]
    public async Task LookupAsync_WithUnknownPrefix_ReturnsNullWithoutQueryingRepositories()
    {
        var result = await CreateService().LookupAsync(new RequestTrackingLookupDto
        {
            ReferenceCode = "XYZ-20260821-ABC234",
            Email = "user@example.com"
        });

        Assert.Null(result);
        _orders.Verify(r => r.GetAllAsync(), Times.Never);
        _contacts.Verify(r => r.GetAllAsync(), Times.Never);
        _affiliates.Verify(r => r.GetAllAsync(), Times.Never);
    }


    [Fact]
    public async Task LookupAsync_OrderWithoutExistingPlan_UsesFallbackTitle()
    {
        var order = new OrderRequest
        {
            ReferenceCode = "ORD-20260822-NOPLAN",
            Email = "customer@example.com",
            CustomerName = "Customer",
            PhoneNumber = "0900000000",
            BillingCycle = "Monthly",
            Status = OrderStatus.New,
            ServicePlanId = Guid.NewGuid()
        };
        _orders.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { order });
        _plans.Setup(r => r.GetByIdAsync(order.ServicePlanId)).ReturnsAsync((ServicePlan?)null);

        var result = await CreateService().LookupAsync(new RequestTrackingLookupDto
        {
            ReferenceCode = order.ReferenceCode,
            Email = order.Email
        });

        Assert.NotNull(result);
        Assert.Equal("Yêu cầu dịch vụ NovaCloud", result!.Title);
        Assert.Equal("Chu kỳ thanh toán: Theo tháng", result.Subtitle);
    }

    [Fact]
    public async Task LookupAsync_YearlyOrder_ReturnsYearlySubtitle()
    {
        var plan = new ServicePlan { Name = "VPS Yearly" };
        var order = new OrderRequest
        {
            ReferenceCode = "ORD-20260822-YEARLY",
            Email = "yearly@example.com",
            CustomerName = "Customer",
            PhoneNumber = "0900000000",
            BillingCycle = "Yearly",
            Status = OrderStatus.Completed,
            ServicePlanId = plan.Id
        };
        _orders.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { order });
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);

        var result = await CreateService().LookupAsync(new RequestTrackingLookupDto
        {
            ReferenceCode = order.ReferenceCode,
            Email = order.Email
        });

        Assert.Equal("Chu kỳ thanh toán: Theo năm", result!.Subtitle);
    }

    [Fact]
    public async Task LookupAsync_AffiliateWithoutCompany_UsesProgramFallbackSubtitle()
    {
        var affiliate = new AffiliateApplication
        {
            ReferenceCode = "AFF-20260822-NOCOMP",
            Email = "partner@example.com",
            FullName = "Partner",
            PhoneNumber = "0900000000",
            CompanyName = null,
            Status = "New"
        };
        _affiliates.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { affiliate });

        var result = await CreateService().LookupAsync(new RequestTrackingLookupDto
        {
            ReferenceCode = affiliate.ReferenceCode,
            Email = affiliate.Email
        });

        Assert.NotNull(result);
        Assert.Equal("Chương trình Affiliate", result!.Subtitle);
    }

    [Fact]
    public async Task LookupAsync_WithWrongAffiliateEmail_ReturnsNull()
    {
        var affiliate = new AffiliateApplication
        {
            ReferenceCode = "AFF-20260822-PRIVATE",
            Email = "owner@example.com",
            FullName = "Partner",
            PhoneNumber = "0900000000",
            Status = "Processing"
        };
        _affiliates.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { affiliate });

        var result = await CreateService().LookupAsync(new RequestTrackingLookupDto
        {
            ReferenceCode = affiliate.ReferenceCode,
            Email = "attacker@example.com"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task LookupAsync_WithKnownPrefixButUnknownCode_ReturnsNull()
    {
        var result = await CreateService().LookupAsync(new RequestTrackingLookupDto
        {
            ReferenceCode = "ORD-20260822-NOTFOUND",
            Email = "user@example.com"
        });

        Assert.Null(result);
        _orders.Verify(r => r.GetAllAsync(), Times.Once);
        _affiliates.Verify(r => r.GetAllAsync(), Times.Never);
        _contacts.Verify(r => r.GetAllAsync(), Times.Never);
    }

    private RequestTrackingService CreateService() => new(
        _orders.Object,
        _affiliates.Object,
        _contacts.Object,
        _plans.Object);
}
