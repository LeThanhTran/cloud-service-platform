using CloudService.Application.DTOs.ServiceCategories;

namespace CloudService.Application.Interfaces.Services;

public interface IServiceCategoryService
{
    Task<IEnumerable<ServiceCategoryDto>> GetAllAsync();

    Task<ServiceCategoryDto?> GetByIdAsync(Guid id);

    Task<ServiceCategoryDto> CreateAsync(CreateServiceCategoryDto dto);

    Task<bool> DeleteAsync(Guid id);
}