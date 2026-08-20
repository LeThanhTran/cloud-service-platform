using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.OrderRequests;

public class CreateOrderRequestDto
{
    [Required, MaxLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? CompanyName { get; set; }

    [Required, MaxLength(30)]
    public string BillingCycle { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Note { get; set; }

    [Required]
    public Guid ServicePlanId { get; set; }
}
