using CloudService.Application.DTOs.PlanPrices;

namespace CloudService.Application.Interfaces.Services;

public interface IPlanPriceService
{
    Task<IEnumerable<PlanPriceDto>> GetAllAsync();
    Task<PlanPriceDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<PlanPriceDto>> GetByServicePlanIdAsync(Guid servicePlanId);
    Task<PlanPriceDto> CreateAsync(CreatePlanPriceDto dto);
    Task<bool> UpdateAsync(Guid id, UpdatePlanPriceDto dto);
    Task<bool> DeleteAsync(Guid id);
}