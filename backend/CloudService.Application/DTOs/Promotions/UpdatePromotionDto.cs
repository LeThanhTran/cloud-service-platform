using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.Promotions;

public class UpdatePromotionDto
{
    [Required(ErrorMessage = "Tên khuyến mãi không được để trống.")]
    [StringLength(150, ErrorMessage = "Tên khuyến mãi tối đa 150 ký tự.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Mô tả tối đa 500 ký tự.")]
    public string? Description { get; set; }

    [Range(typeof(decimal), "0.01", "100",
        ErrorMessage = "Phần trăm giảm giá phải lớn hơn 0 và không vượt quá 100.")]
    public decimal DiscountPercent { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; }

    public Guid ServicePlanId { get; set; }
}