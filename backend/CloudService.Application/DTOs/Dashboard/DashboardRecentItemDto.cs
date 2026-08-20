namespace CloudService.Application.DTOs.Dashboard;

public class DashboardRecentItemDto
{
    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Subtitle { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string Link { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}
