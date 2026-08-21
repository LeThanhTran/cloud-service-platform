using CloudService.Application.DTOs.AuditLogs;
using CloudService.Application.DTOs.Common;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class AuditLogService : IAuditLogService
{
    private const int MaxPageSize = 100;

    private readonly IRepository<AuditLog> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public AuditLogService(
        IRepository<AuditLog> repository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task LogAsync(CreateAuditLogDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserId))
            throw new ArgumentException("UserId của Audit Log không hợp lệ.");

        if (string.IsNullOrWhiteSpace(dto.Action))
            throw new ArgumentException("Action của Audit Log không hợp lệ.");

        var entity = new AuditLog
        {
            UserId = dto.UserId.Trim(),
            UserName = NormalizeOptional(dto.UserName),
            UserRole = NormalizeOptional(dto.UserRole),
            Action = dto.Action.Trim().ToUpperInvariant(),
            EntityType = NormalizeOptional(dto.EntityType),
            EntityId = dto.EntityId,
            ReferenceCode = NormalizeOptional(dto.ReferenceCode),
            Description = NormalizeOptional(dto.Description),
            OldValue = NormalizeOptional(dto.OldValue),
            NewValue = NormalizeOptional(dto.NewValue)
        };

        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<PagedResultDto<AuditLogDto>> GetPagedAsync(
        string? search,
        string? action,
        string? entityType,
        string? userRole,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize)
    {
        ValidatePaging(page, pageSize);

        var query = (await _repository.GetAllAsync()).AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();

            query = query.Where(log =>
                log.UserId.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                (log.UserName?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (log.UserRole?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false) ||
                log.Action.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                (log.EntityType?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (log.ReferenceCode?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (log.Description?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (log.OldValue?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (log.NewValue?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            var normalized = action.Trim();
            query = query.Where(log =>
                string.Equals(log.Action, normalized, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(entityType))
        {
            var normalized = entityType.Trim();
            query = query.Where(log =>
                string.Equals(log.EntityType, normalized, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(userRole))
        {
            var normalized = userRole.Trim();
            query = query.Where(log =>
                string.Equals(log.UserRole, normalized, StringComparison.OrdinalIgnoreCase));
        }

        if (from.HasValue)
        {
            var fromDate = DateTime.SpecifyKind(from.Value.Date, DateTimeKind.Utc);
            query = query.Where(log => log.CreatedAt >= fromDate);
        }

        if (to.HasValue)
        {
            var untilExclusive = DateTime.SpecifyKind(to.Value.Date.AddDays(1), DateTimeKind.Utc);
            query = query.Where(log => log.CreatedAt < untilExclusive);
        }

        var ordered = query
            .OrderByDescending(log => log.CreatedAt)
            .ToList();

        var totalItems = ordered.Count;
        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        return new PagedResultDto<AuditLogDto>
        {
            Items = ordered
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

    private static AuditLogDto Map(AuditLog log)
    {
        return new AuditLogDto
        {
            Id = log.Id,
            UserId = log.UserId,
            UserName = log.UserName ?? "Không xác định",
            UserRole = log.UserRole ?? "Unknown",
            Action = log.Action,
            EntityType = log.EntityType ?? "System",
            EntityId = log.EntityId,
            ReferenceCode = log.ReferenceCode,
            Description = log.Description,
            OldValue = log.OldValue,
            NewValue = log.NewValue,
            CreatedAt = log.CreatedAt
        };
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void ValidatePaging(int page, int pageSize)
    {
        if (page < 1)
            throw new ArgumentException("Page phải lớn hơn hoặc bằng 1.");

        if (pageSize < 1 || pageSize > MaxPageSize)
            throw new ArgumentException($"PageSize phải từ 1 đến {MaxPageSize}.");
    }
}
