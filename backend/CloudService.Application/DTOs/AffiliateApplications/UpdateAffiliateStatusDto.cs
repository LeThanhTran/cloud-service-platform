using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.AffiliateApplications;

public class UpdateAffiliateStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
