using CloudService.Application.DTOs.ServiceCategories;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Entities;

namespace CloudService.Application.Services;

public class ServiceCategoryService : IServiceCategoryService
{
    private readonly IUnitOfWork _unitOfWork;

    public ServiceCategoryService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ServiceCategoryDto>> GetAllAsync()
    {
        var categories = await _unitOfWork
            .Repository<ServiceCategory>()
            .GetAllAsync();

        return categories.Select(category => new ServiceCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            Slug = category.Slug,
            IsActive = category.IsActive
        });
    }

    public async Task<ServiceCategoryDto?> GetByIdAsync(Guid id)
    {
        var category = await _unitOfWork
            .Repository<ServiceCategory>()
            .GetByIdAsync(id);

        if (category == null)
            return null;

        return new ServiceCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            Slug = category.Slug,
            IsActive = category.IsActive
        };
    }

    public async Task<ServiceCategoryDto> CreateAsync(
        CreateServiceCategoryDto dto)
    {
        var category = new ServiceCategory
        {
            Name = dto.Name,
            Description = dto.Description,
            Slug = dto.Slug
        };

        await _unitOfWork
            .Repository<ServiceCategory>()
            .AddAsync(category);

        await _unitOfWork.SaveChangesAsync();

        return new ServiceCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            Slug = category.Slug,
            IsActive = category.IsActive
        };
    }
    public async Task<ServiceCategoryDto?> UpdateAsync(
    Guid id,
    UpdateServiceCategoryDto dto)
    {
        var repository =
            _unitOfWork.Repository<ServiceCategory>();

        var category = await repository.GetByIdAsync(id);

        if (category == null)
            return null;

        category.Name = dto.Name;
        category.Description = dto.Description;
        category.Slug = dto.Slug;
        category.IsActive = dto.IsActive;

        repository.Update(category);

        await _unitOfWork.SaveChangesAsync();

        return new ServiceCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            Slug = category.Slug,
            IsActive = category.IsActive
        };
    }
    public async Task<bool> DeleteAsync(Guid id)
    {
        var repository =
            _unitOfWork.Repository<ServiceCategory>();

        var category = await repository.GetByIdAsync(id);

        if (category == null)
            return false;

        repository.Delete(category);

        await _unitOfWork.SaveChangesAsync();

        return true;
    }
}