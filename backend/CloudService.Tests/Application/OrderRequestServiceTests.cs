using CloudService.Application.DTOs.OrderRequests;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Moq;

namespace CloudService.Tests.Application;

public class OrderRequestServiceTests
{
    private readonly Mock<IRepository<OrderRequest>> _orders = new();
    private readonly Mock<IRepository<ServicePlan>> _plans = new();
    private readonly Mock<IRepository<PlanPrice>> _prices = new();
    private readonly Mock<INotificationService> _notifications = new();
    private readonly Mock<IEmailSender> _emails = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    public OrderRequestServiceTests()
    {
        _unitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _notifications
            .Setup(n => n.CreateForRolesAsync(
                It.IsAny<IEnumerable<string>>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _notifications
            .Setup(n => n.CreateForUserByEmailAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _emails.Setup(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(true);
    }

    [Fact]
    public async Task CreateAsync_WithValidData_CreatesNewOrderAndNotification()
    {
        var plan = ActivePlan();
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);
        _prices.Setup(r => r.GetAllAsync()).ReturnsAsync(new[]
        {
            new PlanPrice { ServicePlanId = plan.Id, BillingCycle = "Monthly", IsActive = true, Price = 199000 }
        });

        OrderRequest? captured = null;
        _orders.Setup(r => r.AddAsync(It.IsAny<OrderRequest>()))
            .Callback<OrderRequest>(entity => captured = entity)
            .Returns(Task.CompletedTask);

        var result = await CreateService().CreateAsync(ValidCreateDto(plan.Id));

        Assert.NotNull(captured);
        Assert.Equal(OrderStatus.New, captured!.Status);
        Assert.Equal("customer@example.com", captured.Email);
        Assert.Equal("Monthly", captured.BillingCycle);
        Assert.StartsWith("ORD-", result.ReferenceCode);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        _notifications.Verify(n => n.CreateForRolesAsync(
            It.Is<IEnumerable<string>>(roles => roles.Contains("Admin") && roles.Contains("Editor")),
            It.IsAny<string>(), It.IsAny<string>(), "Order", "/admin/orders"), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyServicePlanId_ThrowsArgumentException()
    {
        var dto = ValidCreateDto(Guid.Empty);

        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().CreateAsync(dto));
        _orders.Verify(r => r.AddAsync(It.IsAny<OrderRequest>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WhenPlanMissing_ThrowsKeyNotFoundException()
    {
        var id = Guid.NewGuid();
        _plans.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((ServicePlan?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => CreateService().CreateAsync(ValidCreateDto(id)));
    }

    [Fact]
    public async Task CreateAsync_WhenPlanInactive_ThrowsInvalidOperationException()
    {
        var plan = ActivePlan();
        plan.IsActive = false;
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);

        await Assert.ThrowsAsync<InvalidOperationException>(() => CreateService().CreateAsync(ValidCreateDto(plan.Id)));
    }

    [Fact]
    public async Task CreateAsync_WithInvalidBillingCycle_ThrowsArgumentException()
    {
        var plan = ActivePlan();
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);
        var dto = ValidCreateDto(plan.Id);
        dto.BillingCycle = "Weekly";

        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().CreateAsync(dto));
    }

    [Fact]
    public async Task UpdateStatusAsync_NewToProcessing_UpdatesAndSendsCustomerMessages()
    {
        var plan = ActivePlan();
        var order = new OrderRequest
        {
            ServicePlanId = plan.Id,
            CustomerName = "Customer",
            Email = "customer@example.com",
            PhoneNumber = "0900000000",
            BillingCycle = "Monthly",
            Status = OrderStatus.New,
            ReferenceCode = "ORD-20260821-ABC234"
        };
        _orders.Setup(r => r.GetByIdAsync(order.Id)).ReturnsAsync(order);
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);

        var result = await CreateService().UpdateStatusAsync(
            order.Id,
            new UpdateOrderStatusDto { Status = "Processing" });

        Assert.NotNull(result);
        Assert.Equal("Processing", result!.Status);
        _orders.Verify(r => r.Update(order), Times.Once);
        _notifications.Verify(n => n.CreateForUserByEmailAsync(
            order.Email, It.IsAny<string>(), It.IsAny<string>(), "Order", "/account/requests"), Times.Once);
        _emails.Verify(e => e.SendAsync(order.Email, It.IsAny<string>(), It.Is<string>(html => html.Contains(order.ReferenceCode!))), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_CompletedToProcessing_ThrowsInvalidOperationException()
    {
        var order = new OrderRequest
        {
            CustomerName = "Customer",
            Email = "customer@example.com",
            PhoneNumber = "0900000000",
            BillingCycle = "Monthly",
            Status = OrderStatus.Completed,
            ServicePlanId = Guid.NewGuid()
        };
        _orders.Setup(r => r.GetByIdAsync(order.Id)).ReturnsAsync(order);

        await Assert.ThrowsAsync<InvalidOperationException>(() => CreateService().UpdateStatusAsync(
            order.Id,
            new UpdateOrderStatusDto { Status = "Processing" }));

        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
    }


    [Fact]
    public async Task CreateAsync_WhenActivePriceMissing_ThrowsInvalidOperationException()
    {
        var plan = ActivePlan();
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);
        _prices.Setup(r => r.GetAllAsync()).ReturnsAsync(new[]
        {
            new PlanPrice { ServicePlanId = plan.Id, BillingCycle = "Yearly", IsActive = true, Price = 1990000 }
        });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateService().CreateAsync(ValidCreateDto(plan.Id)));

        _orders.Verify(r => r.AddAsync(It.IsAny<OrderRequest>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_NormalizesCustomerDataAndBillingCycle()
    {
        var plan = ActivePlan();
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);
        _prices.Setup(r => r.GetAllAsync()).ReturnsAsync(new[]
        {
            new PlanPrice { ServicePlanId = plan.Id, BillingCycle = "Monthly", IsActive = true, Price = 199000 }
        });

        OrderRequest? captured = null;
        _orders.Setup(r => r.AddAsync(It.IsAny<OrderRequest>()))
            .Callback<OrderRequest>(entity => captured = entity)
            .Returns(Task.CompletedTask);

        await CreateService().CreateAsync(ValidCreateDto(plan.Id));

        Assert.NotNull(captured);
        Assert.Equal("Customer", captured!.CustomerName);
        Assert.Equal("customer@example.com", captured.Email);
        Assert.Equal("0900000000", captured.PhoneNumber);
        Assert.Equal("Nova Test", captured.CompanyName);
        Assert.Equal("Monthly", captured.BillingCycle);
        Assert.Equal("Demo", captured.Note);
    }

    [Fact]
    public async Task UpdateStatusAsync_NewToRejected_IsAllowedAndNotifiesCustomer()
    {
        var order = new OrderRequest
        {
            CustomerName = "Customer",
            Email = "customer@example.com",
            PhoneNumber = "0900000000",
            BillingCycle = "Monthly",
            Status = OrderStatus.New,
            ServicePlanId = Guid.NewGuid(),
            ReferenceCode = "ORD-20260821-ABC234"
        };
        _orders.Setup(r => r.GetByIdAsync(order.Id)).ReturnsAsync(order);

        var result = await CreateService().UpdateStatusAsync(
            order.Id,
            new UpdateOrderStatusDto { Status = "Rejected" });

        Assert.Equal("Rejected", result!.Status);
        _notifications.Verify(n => n.CreateForUserByEmailAsync(
            order.Email, It.IsAny<string>(), It.IsAny<string>(), "Order", "/account/requests"), Times.Once);
        _emails.Verify(e => e.SendAsync(order.Email, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_SameStatus_DoesNotSendCustomerMessages()
    {
        var order = new OrderRequest
        {
            CustomerName = "Customer",
            Email = "customer@example.com",
            PhoneNumber = "0900000000",
            BillingCycle = "Monthly",
            Status = OrderStatus.Processing,
            ServicePlanId = Guid.NewGuid()
        };
        _orders.Setup(r => r.GetByIdAsync(order.Id)).ReturnsAsync(order);

        var result = await CreateService().UpdateStatusAsync(
            order.Id,
            new UpdateOrderStatusDto { Status = "processing" });

        Assert.Equal("Processing", result!.Status);
        _notifications.Verify(n => n.CreateForUserByEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        _emails.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_WithInvalidStatus_ThrowsArgumentException()
    {
        var order = new OrderRequest
        {
            CustomerName = "Customer",
            Email = "customer@example.com",
            PhoneNumber = "0900000000",
            BillingCycle = "Monthly",
            Status = OrderStatus.New,
            ServicePlanId = Guid.NewGuid()
        };
        _orders.Setup(r => r.GetByIdAsync(order.Id)).ReturnsAsync(order);

        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().UpdateStatusAsync(
            order.Id,
            new UpdateOrderStatusDto { Status = "Cancelled" }));
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenOrderMissing_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _orders.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((OrderRequest?)null);

        var result = await CreateService().UpdateStatusAsync(
            id,
            new UpdateOrderStatusDto { Status = "Processing" });

        Assert.Null(result);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task GetForManagementAsync_FiltersBySearchAndStatus()
    {
        var plan = ActivePlan();
        var matching = new OrderRequest
        {
            CustomerName = "Nguyen Van An",
            Email = "an@example.com",
            PhoneNumber = "0900000001",
            BillingCycle = "Monthly",
            Status = OrderStatus.Processing,
            ServicePlanId = plan.Id,
            ReferenceCode = "ORD-20260822-AN1234",
            CreatedAt = DateTime.UtcNow
        };
        var other = new OrderRequest
        {
            CustomerName = "Other Customer",
            Email = "other@example.com",
            PhoneNumber = "0900000002",
            BillingCycle = "Yearly",
            Status = OrderStatus.New,
            ServicePlanId = plan.Id,
            ReferenceCode = "ORD-20260822-OT1234",
            CreatedAt = DateTime.UtcNow.AddMinutes(-1)
        };
        _orders.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { matching, other });
        _plans.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { plan });

        var result = await CreateService().GetForManagementAsync(
            "an@example.com", "Processing", "latest", 1, 10);

        var item = Assert.Single(result.Items);
        Assert.Equal(matching.Id, item.Id);
        Assert.Equal(1, result.TotalItems);
    }

    private OrderRequestService CreateService() => new(
        _orders.Object,
        _plans.Object,
        _prices.Object,
        _notifications.Object,
        _emails.Object,
        _unitOfWork.Object);

    private static ServicePlan ActivePlan() => new()
    {
        Id = Guid.NewGuid(),
        Name = "VPS Basic",
        IsActive = true
    };

    private static CreateOrderRequestDto ValidCreateDto(Guid planId) => new()
    {
        CustomerName = " Customer ",
        Email = " Customer@Example.COM ",
        PhoneNumber = " 0900000000 ",
        CompanyName = " Nova Test ",
        BillingCycle = " monthly ",
        Note = " Demo ",
        ServicePlanId = planId
    };
}
