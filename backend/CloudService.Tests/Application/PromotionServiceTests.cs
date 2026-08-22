using CloudService.Application.DTOs.Promotions;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Entities;
using Moq;

namespace CloudService.Tests.Application;

public class PromotionServiceTests
{
    private readonly Mock<IRepository<Promotion>> _promotions = new();
    private readonly Mock<IRepository<ServicePlan>> _plans = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    public PromotionServiceTests()
    {
        _promotions.Setup(repository => repository.GetAllAsync()).ReturnsAsync(Array.Empty<Promotion>());
        _unitOfWork.Setup(unit => unit.SaveChangesAsync()).ReturnsAsync(1);
    }

    [Fact]
    public async Task GetByServicePlanIdAsync_ReturnsOnlyMatchingPromotions()
    {
        var planId = Guid.NewGuid();
        _promotions.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            new Promotion { Name = "Sale 10", ServicePlanId = planId, DiscountPercent = 10 },
            new Promotion { Name = "Other", ServicePlanId = Guid.NewGuid(), DiscountPercent = 20 }
        });

        var result = (await CreateService().GetByServicePlanIdAsync(planId)).ToList();

        Assert.Single(result);
        Assert.Equal("Sale 10", result[0].Name);
    }

    [Fact]
    public async Task CreateAsync_EndBeforeStart_IsRejected()
    {
        var start = DateTime.UtcNow;

        await Assert.ThrowsAsync<ArgumentException>(() =>
            CreateService().CreateAsync(new CreatePromotionDto
            {
                Name = "Invalid",
                ServicePlanId = Guid.NewGuid(),
                DiscountPercent = 10,
                StartDate = start,
                EndDate = start
            }));

        _promotions.Verify(repository => repository.AddAsync(It.IsAny<Promotion>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_UnknownServicePlan_IsRejected()
    {
        var planId = Guid.NewGuid();
        _plans.Setup(repository => repository.GetByIdAsync(planId)).ReturnsAsync((ServicePlan?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            CreateService().CreateAsync(new CreatePromotionDto
            {
                Name = "Sale",
                ServicePlanId = planId,
                DiscountPercent = 10,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(5)
            }));
    }

    [Fact]
    public async Task CreateAsync_ValidPromotion_AddsAndSaves()
    {
        var plan = new ServicePlan { Name = "Hosting Pro" };
        _plans.Setup(repository => repository.GetByIdAsync(plan.Id)).ReturnsAsync(plan);

        Promotion? captured = null;
        _promotions.Setup(repository => repository.AddAsync(It.IsAny<Promotion>()))
            .Callback<Promotion>(entity => captured = entity)
            .Returns(Task.CompletedTask);

        var result = await CreateService().CreateAsync(new CreatePromotionDto
        {
            Name = "Summer Sale",
            Description = "10% off",
            ServicePlanId = plan.Id,
            DiscountPercent = 10,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(7),
            IsActive = true
        });

        Assert.NotNull(captured);
        Assert.Equal("Summer Sale", captured!.Name);
        Assert.Equal(10, result.DiscountPercent);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_MissingPromotion_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _promotions.Setup(repository => repository.GetByIdAsync(id)).ReturnsAsync((Promotion?)null);

        var result = await CreateService().DeleteAsync(id);

        Assert.False(result);
        _promotions.Verify(repository => repository.Delete(It.IsAny<Promotion>()), Times.Never);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }


    [Fact]
    public async Task UpdateAsync_EndBeforeStart_IsRejected()
    {
        var promotion = new Promotion { Name = "Sale", ServicePlanId = Guid.NewGuid() };
        _promotions.Setup(repository => repository.GetByIdAsync(promotion.Id)).ReturnsAsync(promotion);
        var start = DateTime.UtcNow;

        await Assert.ThrowsAsync<ArgumentException>(() =>
            CreateService().UpdateAsync(promotion.Id, new UpdatePromotionDto
            {
                Name = "Invalid",
                ServicePlanId = Guid.NewGuid(),
                DiscountPercent = 10,
                StartDate = start,
                EndDate = start,
                IsActive = true
            }));

        _promotions.Verify(repository => repository.Update(It.IsAny<Promotion>()), Times.Never);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_ValidPromotion_UpdatesAndSaves()
    {
        var plan = new ServicePlan { Name = "Hosting Pro" };
        var promotion = new Promotion
        {
            Name = "Old Sale",
            ServicePlanId = plan.Id,
            DiscountPercent = 5,
            StartDate = DateTime.UtcNow.AddDays(-1),
            EndDate = DateTime.UtcNow.AddDays(1),
            IsActive = true
        };
        _promotions.Setup(repository => repository.GetByIdAsync(promotion.Id)).ReturnsAsync(promotion);
        _plans.Setup(repository => repository.GetByIdAsync(plan.Id)).ReturnsAsync(plan);
        var start = DateTime.UtcNow;

        var result = await CreateService().UpdateAsync(promotion.Id, new UpdatePromotionDto
        {
            Name = "Summer Sale",
            Description = "20% off",
            ServicePlanId = plan.Id,
            DiscountPercent = 20,
            StartDate = start,
            EndDate = start.AddDays(7),
            IsActive = false
        });

        Assert.True(result);
        Assert.Equal("Summer Sale", promotion.Name);
        Assert.Equal(20, promotion.DiscountPercent);
        Assert.False(promotion.IsActive);
        _promotions.Verify(repository => repository.Update(promotion), Times.Once);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ExistingPromotion_DeletesAndSaves()
    {
        var promotion = new Promotion { Name = "Sale", ServicePlanId = Guid.NewGuid() };
        _promotions.Setup(repository => repository.GetByIdAsync(promotion.Id)).ReturnsAsync(promotion);

        var result = await CreateService().DeleteAsync(promotion.Id);

        Assert.True(result);
        _promotions.Verify(repository => repository.Delete(promotion), Times.Once);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    private PromotionService CreateService() => new(
        _promotions.Object,
        _plans.Object,
        _unitOfWork.Object);
}
