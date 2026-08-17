using CloudService.Application.DTOs.Promotions;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class PromotionService : IPromotionService
{
    private readonly IRepository<Promotion> _repository;
    private readonly IRepository<ServicePlan> _servicePlanRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PromotionService(
        IRepository<Promotion> repository,
        IRepository<ServicePlan> servicePlanRepository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _servicePlanRepository = servicePlanRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<PromotionDto>> GetAllAsync()
    {
        var list = await _repository.GetAllAsync();

        return list.Select(p => new PromotionDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            DiscountPercent = p.DiscountPercent,
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            IsActive = p.IsActive,
            ServicePlanId = p.ServicePlanId
        });
    }

    public async Task<PromotionDto?> GetByIdAsync(Guid id)
    {
        var item = await _repository.GetByIdAsync(id);

        if (item == null)
            return null;

        return new PromotionDto
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            DiscountPercent = item.DiscountPercent,
            StartDate = item.StartDate,
            EndDate = item.EndDate,
            IsActive = item.IsActive,
            ServicePlanId = item.ServicePlanId
        };
    }

    public async Task<IEnumerable<PromotionDto>> GetByServicePlanIdAsync(Guid servicePlanId)
    {
        var list = await _repository.GetAllAsync();

        return list
            .Where(p => p.ServicePlanId == servicePlanId)
            .Select(p => new PromotionDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                DiscountPercent = p.DiscountPercent,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                IsActive = p.IsActive,
                ServicePlanId = p.ServicePlanId
            });
    }

    public async Task<PromotionDto> CreateAsync(CreatePromotionDto dto)
    {
        if (dto.ServicePlanId == Guid.Empty)
            throw new ArgumentException("ServicePlanId không hợp lệ.");

        if (dto.EndDate <= dto.StartDate)
            throw new ArgumentException("Ngày kết thúc phải lớn hơn ngày bắt đầu.");

        var servicePlan =
            await _servicePlanRepository.GetByIdAsync(dto.ServicePlanId);

        if (servicePlan == null)
            throw new KeyNotFoundException("Không tìm thấy Service Plan.");

        var entity = new Promotion
        {
            Name = dto.Name,
            Description = dto.Description,
            DiscountPercent = dto.DiscountPercent,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsActive = dto.IsActive,
            ServicePlanId = dto.ServicePlanId
        };

        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        return new PromotionDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            DiscountPercent = entity.DiscountPercent,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            IsActive = entity.IsActive,
            ServicePlanId = entity.ServicePlanId
        };
    }

    public async Task<bool> UpdateAsync(Guid id, UpdatePromotionDto dto)
    {
        var entity = await _repository.GetByIdAsync(id);

        if (entity == null)
            return false;

        if (dto.ServicePlanId == Guid.Empty)
            throw new ArgumentException("ServicePlanId không hợp lệ.");

        if (dto.EndDate <= dto.StartDate)
            throw new ArgumentException("Ngày kết thúc phải lớn hơn ngày bắt đầu.");

        var servicePlan =
            await _servicePlanRepository.GetByIdAsync(dto.ServicePlanId);

        if (servicePlan == null)
            throw new KeyNotFoundException("Không tìm thấy Service Plan.");

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.DiscountPercent = dto.DiscountPercent;
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;
        entity.IsActive = dto.IsActive;
        entity.ServicePlanId = dto.ServicePlanId;

        _repository.Update(entity);

        return await _unitOfWork.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);

        if (entity == null)
            return false;

        _repository.Delete(entity);

        return await _unitOfWork.SaveChangesAsync() > 0;
    }
}