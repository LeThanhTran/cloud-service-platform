using System.Security.Claims;
using CloudService.Application.DTOs.AuditLogs;
using CloudService.Application.Interfaces.Services;

namespace CloudService.WebApi.Utilities;

public static class AuditLogExtensions
{
    public static Task LogFromUserAsync(
        this IAuditLogService auditLogService,
        ClaimsPrincipal user,
        string action,
        string entityType,
        Guid? entityId = null,
        string? referenceCode = null,
        string? description = null,
        string? oldValue = null,
        string? newValue = null)
    {
        var userId =
            user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? "unknown";

        var userName =
            user.FindFirst(ClaimTypes.Name)?.Value
            ?? user.FindFirst(ClaimTypes.Email)?.Value
            ?? "Không xác định";

        var userRole =
            user.FindFirst(ClaimTypes.Role)?.Value
            ?? "Unknown";

        return auditLogService.LogAsync(new CreateAuditLogDto
        {
            UserId = userId,
            UserName = userName,
            UserRole = userRole,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            ReferenceCode = referenceCode,
            Description = description,
            OldValue = oldValue,
            NewValue = newValue
        });
    }

    public static Task LogGuestAsync(
        this IAuditLogService auditLogService,
        string guestName,
        string action,
        string entityType,
        Guid? entityId = null,
        string? referenceCode = null,
        string? description = null,
        string? oldValue = null,
        string? newValue = null)
    {
        return auditLogService.LogAsync(new CreateAuditLogDto
        {
            UserId = "anonymous",
            UserName = string.IsNullOrWhiteSpace(guestName) ? "Khách" : guestName.Trim(),
            UserRole = "Guest",
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            ReferenceCode = referenceCode,
            Description = description,
            OldValue = oldValue,
            NewValue = newValue
        });
    }

}
