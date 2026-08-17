using CloudService.Application.DTOs.PlanPrices;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class PlanPriceService : IPlanPriceService
{
    private readonly IRepository<PlanPrice> _repository;
    private readonly IRepository<ServicePlan> _servicePlanRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PlanPriceService(
        IRepository<PlanPrice> repository,
        IRepository<ServicePlan> servicePlanRepository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _servicePlanRepository = servicePlanRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<PlanPriceDto>> GetAllAsync()
    {
        var list = await _repository.GetAllAsync();

        return list.Select(p => new PlanPriceDto
        {
            Id = p.Id,
            ServicePlanId = p.ServicePlanId,
            BillingCycle = p.BillingCycle,
            Price = p.Price,
            IsActive = p.IsActive
        });
    }

    public async Task<PlanPriceDto?> GetByIdAsync(Guid id)
    {
        var price = await _repository.GetByIdAsync(id);

        if (price == null)
            return null;

        return new PlanPriceDto
        {
            Id = price.Id,
            ServicePlanId = price.ServicePlanId,
            BillingCycle = price.BillingCycle,
            Price = price.Price,
            IsActive = price.IsActive
        };
    }

    public async Task<IEnumerable<PlanPriceDto>> GetByServicePlanIdAsync(Guid servicePlanId)
    {
        var list = await _repository.GetAllAsync();

        return list
            .Where(p => p.ServicePlanId == servicePlanId)
            .Select(p => new PlanPriceDto
            {
                Id = p.Id,
                ServicePlanId = p.ServicePlanId,
                BillingCycle = p.BillingCycle,
                Price = p.Price,
                IsActive = p.IsActive
            });
    }

    public async Task<PlanPriceDto> CreateAsync(CreatePlanPriceDto dto)
    {
        if (dto.ServicePlanId == Guid.Empty)
            throw new ArgumentException("ServicePlanId không hợp lệ.");

        var servicePlan =
            await _servicePlanRepository.GetByIdAsync(dto.ServicePlanId);

        if (servicePlan == null)
            throw new KeyNotFoundException("Không tìm thấy Service Plan.");

        var entity = new PlanPrice
        {
            ServicePlanId = dto.ServicePlanId,
            BillingCycle = dto.BillingCycle,
            Price = dto.Price,
            IsActive = dto.IsActive
        };

        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        return new PlanPriceDto
        {
            Id = entity.Id,
            ServicePlanId = entity.ServicePlanId,
            BillingCycle = entity.BillingCycle,
            Price = entity.Price,
            IsActive = entity.IsActive
        };
    }

    public async Task<bool> UpdateAsync(Guid id, UpdatePlanPriceDto dto)
    {
        var entity = await _repository.GetByIdAsync(id);

        if (entity == null)
            return false;

        if (dto.ServicePlanId == Guid.Empty)
            throw new ArgumentException("ServicePlanId không hợp lệ.");

        var servicePlan =
            await _servicePlanRepository.GetByIdAsync(dto.ServicePlanId);

        if (servicePlan == null)
            throw new KeyNotFoundException("Không tìm thấy Service Plan.");

        entity.ServicePlanId = dto.ServicePlanId;
        entity.BillingCycle = dto.BillingCycle;
        entity.Price = dto.Price;
        entity.IsActive = dto.IsActive;

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