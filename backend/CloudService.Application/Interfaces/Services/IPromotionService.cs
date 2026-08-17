using CloudService.Application.DTOs.Promotions;

namespace CloudService.Application.Interfaces.Services;

public interface IPromotionService
{
    Task<IEnumerable<PromotionDto>> GetAllAsync();
    Task<PromotionDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<PromotionDto>> GetByServicePlanIdAsync(Guid servicePlanId);
    Task<PromotionDto> CreateAsync(CreatePromotionDto dto);
    Task<bool> UpdateAsync(Guid id, UpdatePromotionDto dto);
    Task<bool> DeleteAsync(Guid id);
}