using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public class NewsArticle : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public string? ThumbnailUrl { get; set; }

    public string Category { get; set; } = string.Empty;

    public bool IsPublished { get; set; } = false;

    public DateTime? PublishedAt { get; set; }
}