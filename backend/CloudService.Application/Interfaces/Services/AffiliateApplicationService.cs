using CloudService.Application.DTOs.AffiliateApplications;
using CloudService.Application.DTOs.Common;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class AffiliateApplicationService : IAffiliateApplicationService
{
    private const int MaxPageSize = 100;
    private static readonly string[] AllowedStatuses = new[] { "New", "Processing", "Completed", "Rejected" };

    private readonly IRepository<AffiliateApplication> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public AffiliateApplicationService(
        IRepository<AffiliateApplication> repository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<AffiliateApplicationDto> CreateAsync(CreateAffiliateApplicationDto dto)
    {
        var entity = new AffiliateApplication
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            CompanyName = NormalizeOptional(dto.CompanyName),
            Website = NormalizeOptional(dto.Website),
            Note = NormalizeOptional(dto.Note),
            Status = "New"
        };

        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<PagedResultDto<AffiliateApplicationDto>> GetForManagementAsync(
        string? search,
        string? status,
        string? sort,
        int page,
        int pageSize)
    {
        ValidatePaging(page, pageSize);
        var applications = (await _repository.GetAllAsync()).AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            applications = applications.Where(application =>
                application.FullName.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                application.Email.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                application.PhoneNumber.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                (application.CompanyName?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (application.Website?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = NormalizeStatus(status);
            applications = applications.Where(application =>
                string.Equals(application.Status, normalizedStatus, StringComparison.OrdinalIgnoreCase));
        }

        applications = NormalizeSort(sort) switch
        {
            "oldest" => applications.OrderBy(application => application.CreatedAt),
            "status" => applications.OrderBy(application => StatusOrder(application.Status))
                .ThenByDescending(application => application.CreatedAt),
            _ => applications.OrderByDescending(application => application.CreatedAt)
        };

        var materialized = applications.ToList();
        var totalItems = materialized.Count;
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

        return new PagedResultDto<AffiliateApplicationDto>
        {
            Items = materialized
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(Map)
                .ToArray(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }

    public async Task<AffiliateApplicationDto?> GetByIdAsync(Guid id)
    {
        var application = await _repository.GetByIdAsync(id);
        return application == null ? null : Map(application);
    }

    public async Task<AffiliateApplicationDto?> UpdateStatusAsync(Guid id, UpdateAffiliateStatusDto dto)
    {
        var application = await _repository.GetByIdAsync(id);
        if (application == null)
            return null;

        var nextStatus = NormalizeStatus(dto.Status);
        EnsureValidTransition(application.Status, nextStatus);

        application.Status = nextStatus;
        application.UpdatedAt = DateTime.UtcNow;
        _repository.Update(application);
        await _unitOfWork.SaveChangesAsync();
        return Map(application);
    }

    private static void EnsureValidTransition(string currentStatus, string nextStatus)
    {
        var current = NormalizeStatus(currentStatus);
        if (string.Equals(current, nextStatus, StringComparison.OrdinalIgnoreCase))
            return;

        var valid = current switch
        {
            "New" => nextStatus is "Processing" or "Rejected",
            "Processing" => nextStatus is "Completed" or "Rejected",
            "Completed" => false,
            "Rejected" => false,
            _ => false
        };

        if (!valid)
        {
            throw new InvalidOperationException(
                $"Không thể chuyển trạng thái hồ sơ Affiliate từ {current} sang {nextStatus}. " +
                "Luồng hợp lệ: New → Processing → Completed hoặc Rejected.");
        }
    }

    private static string NormalizeStatus(string status)
    {
        var match = AllowedStatuses.FirstOrDefault(allowed =>
            string.Equals(allowed, status?.Trim(), StringComparison.OrdinalIgnoreCase));

        return match ?? throw new ArgumentException(
            "Trạng thái không hợp lệ. Dùng New, Processing, Completed hoặc Rejected.");
    }

    private static string NormalizeSort(string? sort)
    {
        if (string.IsNullOrWhiteSpace(sort))
            return "latest";

        var normalized = sort.Trim().ToLowerInvariant();
        if (normalized is "latest" or "oldest" or "status")
            return normalized;

        throw new ArgumentException("Sort không hợp lệ. Dùng latest, oldest hoặc status.");
    }

    private static int StatusOrder(string status) => status switch
    {
        "New" => 1,
        "Processing" => 2,
        "Completed" => 3,
        "Rejected" => 4,
        _ => 5
    };

    private static void ValidatePaging(int page, int pageSize)
    {
        if (page < 1)
            throw new ArgumentException("Page phải lớn hơn hoặc bằng 1.");
        if (pageSize < 1 || pageSize > MaxPageSize)
            throw new ArgumentException($"PageSize phải nằm trong khoảng từ 1 đến {MaxPageSize}.");
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static AffiliateApplicationDto Map(AffiliateApplication application) => new()
    {
        Id = application.Id,
        FullName = application.FullName,
        Email = application.Email,
        PhoneNumber = application.PhoneNumber,
        CompanyName = application.CompanyName,
        Website = application.Website,
        Note = application.Note,
        Status = application.Status,
        CreatedAt = application.CreatedAt,
        UpdatedAt = application.UpdatedAt
    };
}
