using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public class Promotion : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    // Phần trăm giảm giá, ví dụ 10 = giảm 10%
    public decimal DiscountPercent { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    // Foreign Key
    public Guid ServicePlanId { get; set; }

    // Navigation Property
    public ServicePlan? ServicePlan { get; set; }
}