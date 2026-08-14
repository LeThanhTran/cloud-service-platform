namespace CloudService.Application.DTOs.ServiceCategories;

public class CreateServiceCategoryDto
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? Slug { get; set; }
}