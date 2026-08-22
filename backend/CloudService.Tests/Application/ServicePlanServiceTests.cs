using CloudService.Application.DTOs.ServicePlans;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Entities;
using Moq;

namespace CloudService.Tests.Application;

public class ServicePlanServiceTests
{
    private readonly Mock<IRepository<ServicePlan>> _plans = new();
    private readonly Mock<IRepository<ServiceCategory>> _categories = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    public ServicePlanServiceTests()
    {
        _plans.Setup(r => r.GetAllAsync()).ReturnsAsync(Array.Empty<ServicePlan>());
        _unitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
    }

    [Fact]
    public async Task GetByIdAsync_MissingPlan_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _plans.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((ServicePlan?)null);

        var result = await CreateService().GetByIdAsync(id);

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_EmptyName_IsRejected()
    {
        var dto = ValidCreateDto();
        dto.Name = "   ";

        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().CreateAsync(dto));
        _plans.Verify(r => r.AddAsync(It.IsAny<ServicePlan>()), Times.Never);
    }

    [Theory]
    [InlineData(0, 4, 80, 1000)]
    [InlineData(2, 0, 80, 1000)]
    [InlineData(2, 4, 0, 1000)]
    [InlineData(2, 4, 80, 0)]
    public async Task CreateAsync_NonPositiveSpecs_AreRejected(int cpu, int ram, int storage, int bandwidth)
    {
        var dto = ValidCreateDto();
        dto.CpuCores = cpu;
        dto.RamGB = ram;
        dto.StorageGB = storage;
        dto.BandwidthGB = bandwidth;

        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().CreateAsync(dto));
        _plans.Verify(r => r.AddAsync(It.IsAny<ServicePlan>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_EmptyCategoryId_IsRejected()
    {
        var dto = ValidCreateDto();
        dto.ServiceCategoryId = Guid.Empty;

        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().CreateAsync(dto));
        _plans.Verify(r => r.AddAsync(It.IsAny<ServicePlan>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_UnknownCategory_IsRejected()
    {
        var dto = ValidCreateDto();
        _categories.Setup(r => r.GetByIdAsync(dto.ServiceCategoryId)).ReturnsAsync((ServiceCategory?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => CreateService().CreateAsync(dto));
        _plans.Verify(r => r.AddAsync(It.IsAny<ServicePlan>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ValidPlan_TrimsAndSaves()
    {
        var dto = ValidCreateDto();
        dto.Name = "  VPS Basic  ";
        dto.Description = "  Starter VPS  ";
        _categories.Setup(r => r.GetByIdAsync(dto.ServiceCategoryId))
            .ReturnsAsync(new ServiceCategory { Id = dto.ServiceCategoryId, Name = "VPS" });

        ServicePlan? captured = null;
        _plans.Setup(r => r.AddAsync(It.IsAny<ServicePlan>()))
            .Callback<ServicePlan>(entity => captured = entity)
            .Returns(Task.CompletedTask);

        var result = await CreateService().CreateAsync(dto);

        Assert.NotNull(captured);
        Assert.Equal("VPS Basic", captured!.Name);
        Assert.Equal("Starter VPS", captured.Description);
        Assert.Equal(dto.ServiceCategoryId, result.ServiceCategoryId);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_MissingPlan_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _plans.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((ServicePlan?)null);

        var result = await CreateService().UpdateAsync(id, ValidUpdateDto());

        Assert.False(result);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_UnknownCategory_IsRejected()
    {
        var plan = new ServicePlan { Name = "VPS" };
        var dto = ValidUpdateDto();
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);
        _categories.Setup(r => r.GetByIdAsync(dto.ServiceCategoryId)).ReturnsAsync((ServiceCategory?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => CreateService().UpdateAsync(plan.Id, dto));

        _plans.Verify(r => r.Update(It.IsAny<ServicePlan>()), Times.Never);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_ValidPlan_UpdatesAndSaves()
    {
        var plan = new ServicePlan { Name = "Old", CpuCores = 1, RamGB = 1, StorageGB = 20, BandwidthGB = 100 };
        var dto = ValidUpdateDto();
        dto.Name = "  VPS Pro  ";
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);
        _categories.Setup(r => r.GetByIdAsync(dto.ServiceCategoryId))
            .ReturnsAsync(new ServiceCategory { Id = dto.ServiceCategoryId, Name = "VPS" });

        var result = await CreateService().UpdateAsync(plan.Id, dto);

        Assert.True(result);
        Assert.Equal("VPS Pro", plan.Name);
        Assert.Equal(dto.CpuCores, plan.CpuCores);
        _plans.Verify(r => r.Update(plan), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_MissingPlan_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _plans.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((ServicePlan?)null);

        var result = await CreateService().DeleteAsync(id);

        Assert.False(result);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ExistingPlan_DeletesAndSaves()
    {
        var plan = new ServicePlan { Name = "VPS Basic" };
        _plans.Setup(r => r.GetByIdAsync(plan.Id)).ReturnsAsync(plan);

        var result = await CreateService().DeleteAsync(plan.Id);

        Assert.True(result);
        _plans.Verify(r => r.Delete(plan), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    private ServicePlanService CreateService() => new(_plans.Object, _categories.Object, _unitOfWork.Object);

    private static CreateServicePlanDto ValidCreateDto() => new()
    {
        Name = "VPS Basic",
        Description = "Starter plan",
        CpuCores = 2,
        RamGB = 4,
        StorageGB = 80,
        BandwidthGB = 1000,
        IsActive = true,
        ServiceCategoryId = Guid.NewGuid()
    };

    private static UpdateServicePlanDto ValidUpdateDto() => new()
    {
        Name = "VPS Pro",
        Description = "Professional plan",
        CpuCores = 4,
        RamGB = 8,
        StorageGB = 160,
        BandwidthGB = 2000,
        IsFeatured = true,
        IsActive = true,
        ServiceCategoryId = Guid.NewGuid()
    };
}
