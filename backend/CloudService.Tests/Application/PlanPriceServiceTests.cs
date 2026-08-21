using CloudService.Application.DTOs.PlanPrices;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Entities;
using Moq;

namespace CloudService.Tests.Application;

public class PlanPriceServiceTests
{
    private readonly Mock<IRepository<PlanPrice>> _prices = new();
    private readonly Mock<IRepository<ServicePlan>> _plans = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    public PlanPriceServiceTests()
    {
        _prices.Setup(repository => repository.GetAllAsync()).ReturnsAsync(Array.Empty<PlanPrice>());
        _unitOfWork.Setup(unit => unit.SaveChangesAsync()).ReturnsAsync(1);
    }

    [Fact]
    public async Task GetByServicePlanIdAsync_ReturnsOnlyMatchingPrices()
    {
        var planId = Guid.NewGuid();
        _prices.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            new PlanPrice { ServicePlanId = planId, BillingCycle = "Monthly", Price = 100000, IsActive = true },
            new PlanPrice { ServicePlanId = Guid.NewGuid(), BillingCycle = "Yearly", Price = 900000, IsActive = true }
        });

        var result = (await CreateService().GetByServicePlanIdAsync(planId)).ToList();

        Assert.Single(result);
        Assert.Equal(planId, result[0].ServicePlanId);
        Assert.Equal("Monthly", result[0].BillingCycle);
    }

    [Fact]
    public async Task CreateAsync_UnknownServicePlan_IsRejected()
    {
        var planId = Guid.NewGuid();
        _plans.Setup(repository => repository.GetByIdAsync(planId)).ReturnsAsync((ServicePlan?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            CreateService().CreateAsync(new CreatePlanPriceDto
            {
                ServicePlanId = planId,
                BillingCycle = "Monthly",
                Price = 100000,
                IsActive = true
            }));

        _prices.Verify(repository => repository.AddAsync(It.IsAny<PlanPrice>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ValidPlan_AddsAndSaves()
    {
        var plan = new ServicePlan { Name = "VPS Basic" };
        _plans.Setup(repository => repository.GetByIdAsync(plan.Id)).ReturnsAsync(plan);

        PlanPrice? captured = null;
        _prices.Setup(repository => repository.AddAsync(It.IsAny<PlanPrice>()))
            .Callback<PlanPrice>(entity => captured = entity)
            .Returns(Task.CompletedTask);

        var result = await CreateService().CreateAsync(new CreatePlanPriceDto
        {
            ServicePlanId = plan.Id,
            BillingCycle = "Monthly",
            Price = 150000,
            IsActive = true
        });

        Assert.NotNull(captured);
        Assert.Equal(plan.Id, captured!.ServicePlanId);
        Assert.Equal(150000, result.Price);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_MissingPrice_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _prices.Setup(repository => repository.GetByIdAsync(id)).ReturnsAsync((PlanPrice?)null);

        var result = await CreateService().UpdateAsync(id, new UpdatePlanPriceDto
        {
            ServicePlanId = Guid.NewGuid(),
            BillingCycle = "Monthly",
            Price = 100000,
            IsActive = true
        });

        Assert.False(result);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ExistingPrice_DeletesAndSaves()
    {
        var price = new PlanPrice { BillingCycle = "Monthly", Price = 100000 };
        _prices.Setup(repository => repository.GetByIdAsync(price.Id)).ReturnsAsync(price);

        var result = await CreateService().DeleteAsync(price.Id);

        Assert.True(result);
        _prices.Verify(repository => repository.Delete(price), Times.Once);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    private PlanPriceService CreateService() => new(
        _prices.Object,
        _plans.Object,
        _unitOfWork.Object);
}
