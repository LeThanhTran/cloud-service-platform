namespace CloudService.Application.DTOs.ServiceCategories;

public class ServiceCategoryDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? Slug { get; set; }

    public bool IsActive { get; set; }
}