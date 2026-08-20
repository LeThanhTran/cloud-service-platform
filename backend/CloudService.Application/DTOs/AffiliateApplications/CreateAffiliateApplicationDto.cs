using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.AffiliateApplications;

public class CreateAffiliateApplicationDto
{
    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? CompanyName { get; set; }

    [Url, MaxLength(500)]
    public string? Website { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }
}
