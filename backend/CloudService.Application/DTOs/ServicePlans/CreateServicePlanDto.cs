using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.ServicePlans;

public class CreateServicePlanDto
{
    [Required(ErrorMessage = "Tên gói dịch vụ không được để trống.")]
    [StringLength(150, ErrorMessage = "Tên gói dịch vụ tối đa 150 ký tự.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000, ErrorMessage = "Mô tả tối đa 1000 ký tự.")]
    public string? Description { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "CPU phải lớn hơn 0.")]
    public int CpuCores { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "RAM phải lớn hơn 0.")]
    public int RamGB { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Dung lượng lưu trữ phải lớn hơn 0.")]
    public int StorageGB { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Băng thông phải lớn hơn 0.")]
    public int BandwidthGB { get; set; }

    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid ServiceCategoryId { get; set; }
}
