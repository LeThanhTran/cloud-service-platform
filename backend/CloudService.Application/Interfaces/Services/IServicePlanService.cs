using CloudService.Application.DTOs.ServicePlans;

namespace CloudService.Application.Interfaces.Services;

public interface IServicePlanService
{
    Task<IEnumerable<ServicePlanDto>> GetAllAsync();
    Task<ServicePlanDto?> GetByIdAsync(Guid id);
    Task<ServicePlanDto> CreateAsync(CreateServicePlanDto dto);
    Task<bool> UpdateAsync(Guid id, UpdateServicePlanDto dto);
    Task<bool> DeleteAsync(Guid id);
}