namespace CloudService.Application.DTOs.ServicePlans;

public class ServicePlanDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CpuCores { get; set; }
    public int RamGB { get; set; }
    public int StorageGB { get; set; }
    public int BandwidthGB { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; }
    public Guid ServiceCategoryId { get; set; }
}