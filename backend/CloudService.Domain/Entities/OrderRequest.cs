using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public class OrderRequest : BaseEntity
{
    // Mã thân thiện hiển thị cho khách hàng. Null chỉ áp dụng cho dữ liệu cũ trước migration.
    public string? ReferenceCode { get; set; }

    // Thông tin khách hàng
    public string CustomerName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string? CompanyName { get; set; }

    // Chu kỳ thanh toán khách hàng chọn
    public string BillingCycle { get; set; } = string.Empty;

    public string? Note { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.New;

    // Gói dịch vụ khách hàng chọn
    public Guid ServicePlanId { get; set; }

    public ServicePlan? ServicePlan { get; set; }
}