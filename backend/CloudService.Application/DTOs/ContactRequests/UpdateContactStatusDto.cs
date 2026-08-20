using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.ContactRequests;

public class UpdateContactStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
