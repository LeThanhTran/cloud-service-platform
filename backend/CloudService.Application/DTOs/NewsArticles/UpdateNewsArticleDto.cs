using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.NewsArticles;

public class UpdateNewsArticleDto
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(220)]
    [RegularExpression(
        "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        ErrorMessage = "Slug chỉ được chứa chữ thường không dấu, số và dấu gạch ngang.")]
    public string Slug { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Summary { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [StringLength(500)]
    [Url]
    public string? ThumbnailUrl { get; set; }

    [Required]
    [StringLength(100)]
    public string Category { get; set; } = string.Empty;

    public bool IsPublished { get; set; }
}
