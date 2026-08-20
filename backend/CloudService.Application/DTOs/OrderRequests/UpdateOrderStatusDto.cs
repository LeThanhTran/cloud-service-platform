using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.OrderRequests;

public class UpdateOrderStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
