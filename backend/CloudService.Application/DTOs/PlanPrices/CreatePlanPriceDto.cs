namespace CloudService.Application.DTOs.PlanPrices;

public class CreatePlanPriceDto
{
    public Guid ServicePlanId { get; set; }
    public string BillingCycle { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
}