using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Link { get; set; } = string.Empty;

    public bool IsRead { get; set; }
}
