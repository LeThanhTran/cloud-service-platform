using CloudService.Application.DTOs.AuditLogs;
using CloudService.Application.DTOs.Common;

namespace CloudService.Application.Interfaces.Services;

public interface IAuditLogService
{
    Task LogAsync(CreateAuditLogDto dto);

    Task<PagedResultDto<AuditLogDto>> GetPagedAsync(
        string? search,
        string? action,
        string? entityType,
        string? userRole,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize);
}
