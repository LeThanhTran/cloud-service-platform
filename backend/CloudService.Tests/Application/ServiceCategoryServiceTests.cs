using CloudService.Application.DTOs.ServiceCategories;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Services;
using CloudService.Domain.Entities;
using Moq;

namespace CloudService.Tests.Application;

public class ServiceCategoryServiceTests
{
    private readonly Mock<IRepository<ServiceCategory>> _repository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly ServiceCategoryService _service;

    public ServiceCategoryServiceTests()
    {
        _unitOfWork.Setup(u => u.Repository<ServiceCategory>()).Returns(_repository.Object);
        _unitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _service = new ServiceCategoryService(_unitOfWork.Object);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsMappedCategories()
    {
        _repository.Setup(r => r.GetAllAsync()).ReturnsAsync(new[]
        {
            new ServiceCategory { Name = "VPS", Slug = "vps", IsActive = true },
            new ServiceCategory { Name = "Hosting", Slug = "hosting", IsActive = false }
        });

        var result = (await _service.GetAllAsync()).ToList();

        Assert.Equal(2, result.Count);
        Assert.Equal("VPS", result[0].Name);
        Assert.Equal("hosting", result[1].Slug);
        Assert.False(result[1].IsActive);
    }

    [Fact]
    public async Task CreateAsync_AddsEntityAndSaves()
    {
        ServiceCategory? captured = null;
        _repository
            .Setup(r => r.AddAsync(It.IsAny<ServiceCategory>()))
            .Callback<ServiceCategory>(entity => captured = entity)
            .Returns(Task.CompletedTask);

        var result = await _service.CreateAsync(new CreateServiceCategoryDto
        {
            Name = "Cloud VPS",
            Description = "Máy chủ ảo",
            Slug = "cloud-vps"
        });

        Assert.NotNull(captured);
        Assert.Equal("Cloud VPS", captured!.Name);
        Assert.Equal("cloud-vps", result.Slug);
        _repository.Verify(r => r.AddAsync(It.IsAny<ServiceCategory>()), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenEntityExists_UpdatesAndSaves()
    {
        var id = Guid.NewGuid();
        var category = new ServiceCategory { Id = id, Name = "Old", IsActive = true };
        _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(category);

        var result = await _service.UpdateAsync(id, new UpdateServiceCategoryDto
        {
            Name = "New",
            Description = "Updated",
            Slug = "new",
            IsActive = false
        });

        Assert.NotNull(result);
        Assert.Equal("New", category.Name);
        Assert.False(category.IsActive);
        _repository.Verify(r => r.Update(category), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenEntityMissing_ReturnsNullWithoutSaving()
    {
        var id = Guid.NewGuid();
        _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((ServiceCategory?)null);

        var result = await _service.UpdateAsync(id, new UpdateServiceCategoryDto { Name = "Missing" });

        Assert.Null(result);
        _repository.Verify(r => r.Update(It.IsAny<ServiceCategory>()), Times.Never);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_WhenEntityExists_DeletesAndSaves()
    {
        var id = Guid.NewGuid();
        var category = new ServiceCategory { Id = id, Name = "Delete me" };
        _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(category);

        var result = await _service.DeleteAsync(id);

        Assert.True(result);
        _repository.Verify(r => r.Delete(category), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}
