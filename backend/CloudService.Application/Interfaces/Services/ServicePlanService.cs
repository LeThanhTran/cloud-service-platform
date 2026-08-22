using CloudService.Application.DTOs.ServicePlans;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class ServicePlanService : IServicePlanService
{
    private readonly IRepository<ServicePlan> _repository;
    private readonly IRepository<ServiceCategory> _serviceCategoryRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ServicePlanService(
        IRepository<ServicePlan> repository,
        IRepository<ServiceCategory> serviceCategoryRepository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _serviceCategoryRepository = serviceCategoryRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ServicePlanDto>> GetAllAsync()
    {
        var list = await _repository.GetAllAsync();
        return list.Select(MapToDto);
    }

    public async Task<ServicePlanDto?> GetByIdAsync(Guid id)
    {
        var plan = await _repository.GetByIdAsync(id);
        return plan == null ? null : MapToDto(plan);
    }

    public async Task<ServicePlanDto> CreateAsync(CreateServicePlanDto dto)
    {
        ValidatePlan(dto.Name, dto.CpuCores, dto.RamGB, dto.StorageGB, dto.BandwidthGB);
        await EnsureCategoryExistsAsync(dto.ServiceCategoryId);

        var entity = new ServicePlan
        {
            Name = dto.Name.Trim(),
            Description = NormalizeDescription(dto.Description),
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

        return MapToDto(entity);
    }

    public async Task<bool> UpdateAsync(Guid id, UpdateServicePlanDto dto)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
            return false;

        ValidatePlan(dto.Name, dto.CpuCores, dto.RamGB, dto.StorageGB, dto.BandwidthGB);
        await EnsureCategoryExistsAsync(dto.ServiceCategoryId);

        entity.Name = dto.Name.Trim();
        entity.Description = NormalizeDescription(dto.Description);
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
        if (entity == null)
            return false;

        _repository.Delete(entity);
        return await _unitOfWork.SaveChangesAsync() > 0;
    }

    private async Task EnsureCategoryExistsAsync(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
            throw new ArgumentException("ServiceCategoryId không hợp lệ.");

        var category = await _serviceCategoryRepository.GetByIdAsync(categoryId);
        if (category == null)
            throw new KeyNotFoundException("Không tìm thấy Service Category.");
    }

    private static void ValidatePlan(string? name, int cpuCores, int ramGB, int storageGB, int bandwidthGB)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Tên gói dịch vụ không được để trống.");

        if (cpuCores <= 0 || ramGB <= 0 || storageGB <= 0 || bandwidthGB <= 0)
            throw new ArgumentException("CPU, RAM, Storage và Bandwidth phải lớn hơn 0.");
    }

    private static string? NormalizeDescription(string? description)
        => string.IsNullOrWhiteSpace(description) ? null : description.Trim();

    private static ServicePlanDto MapToDto(ServicePlan plan) => new()
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
