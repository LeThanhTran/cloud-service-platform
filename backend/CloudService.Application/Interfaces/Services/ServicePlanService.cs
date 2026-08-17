using CloudService.Application.DTOs.ServicePlans;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class ServicePlanService : IServicePlanService
{
    private readonly IRepository<ServicePlan> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public ServicePlanService(IRepository<ServicePlan> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ServicePlanDto>> GetAllAsync()
    {
        var list = await _repository.GetAllAsync();
        return list.Select(p => new ServicePlanDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            CpuCores = p.CpuCores,
            RamGB = p.RamGB,
            StorageGB = p.StorageGB,
            BandwidthGB = p.BandwidthGB,
            IsFeatured = p.IsFeatured,
            IsActive = p.IsActive,
            ServiceCategoryId = p.ServiceCategoryId
        });
    }

    public async Task<ServicePlanDto?> GetByIdAsync(Guid id)
    {
        var plan = await _repository.GetByIdAsync(id);
        if (plan == null) return null;

        return new ServicePlanDto
        {
            Id = plan.Id,
            Name = plan.Name,
            Description = plan.Description,
            CpuCores = plan.CpuCores,
            RamGB = plan.RamGB,
            StorageGB = plan.StorageGB,
            BandwidthGB = plan.BandwidthGB,
            IsFeatured = plan.IsFeatured,
            IsActive = plan.IsActive,
            ServiceCategoryId = plan.ServiceCategoryId
        };
    }

    public async Task<ServicePlanDto> CreateAsync(CreateServicePlanDto dto)
    {
        var entity = new ServicePlan
        {
            Name = dto.Name,
            Description = dto.Description,
            CpuCores = dto.CpuCores,
            RamGB = dto.RamGB,
            StorageGB = dto.StorageGB,
            BandwidthGB = dto.BandwidthGB,
            IsFeatured = dto.IsFeatured,
            IsActive = dto.IsActive,
            ServiceCategoryId = dto.ServiceCategoryId
        };

        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        return new ServicePlanDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            CpuCores = entity.CpuCores,
            RamGB = entity.RamGB,
            StorageGB = entity.StorageGB,
            BandwidthGB = entity.BandwidthGB,
            IsFeatured = entity.IsFeatured,
            IsActive = entity.IsActive,
            ServiceCategoryId = entity.ServiceCategoryId
        };
    }

    public async Task<bool> UpdateAsync(Guid id, UpdateServicePlanDto dto)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return false;

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.CpuCores = dto.CpuCores;
        entity.RamGB = dto.RamGB;
        entity.StorageGB = dto.StorageGB;
        entity.BandwidthGB = dto.BandwidthGB;
        entity.IsFeatured = dto.IsFeatured;
        entity.IsActive = dto.IsActive;
        entity.ServiceCategoryId = dto.ServiceCategoryId;

        _repository.Update(entity);
        return await _unitOfWork.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return false;

        _repository.Delete(entity);
        return await _unitOfWork.SaveChangesAsync() > 0;
    }
}