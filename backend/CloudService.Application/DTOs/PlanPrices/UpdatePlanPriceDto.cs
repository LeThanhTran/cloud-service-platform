using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.PlanPrices;

public class UpdatePlanPriceDto
{
    [Required(ErrorMessage = "ServicePlanId không được để trống.")]
    public Guid ServicePlanId { get; set; }

    [Required(ErrorMessage = "Chu kỳ thanh toán không được để trống.")]
    [StringLength(50, ErrorMessage = "Chu kỳ thanh toán tối đa 50 ký tự.")]
    public string BillingCycle { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "9999999999999999.99",
        ErrorMessage = "Giá phải lớn hơn 0.")]
    public decimal Price { get; set; }

    public bool IsActive { get; set; }
}