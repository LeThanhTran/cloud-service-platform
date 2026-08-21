namespace CloudService.Application.DTOs.AuditLogs;

public class CreateAuditLogDto
{
    public string UserId { get; set; } = string.Empty;

    public string? UserName { get; set; }

    public string? UserRole { get; set; }

    public string Action { get; set; } = string.Empty;

    public string? EntityType { get; set; }

    public Guid? EntityId { get; set; }

    public string? ReferenceCode { get; set; }

    public string? Description { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }
}
