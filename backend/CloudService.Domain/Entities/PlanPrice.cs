using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public class PlanPrice : BaseEntity
{
    public decimal Price { get; set; }

    public string BillingCycle { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    // Foreign Key
    public Guid ServicePlanId { get; set; }

    // Navigation Property
    public ServicePlan? ServicePlan { get; set; }
}