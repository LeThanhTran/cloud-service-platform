using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public class AffiliateApplication : BaseEntity
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string? CompanyName { get; set; }

    public string? Website { get; set; }

    public string? Note { get; set; }

    public string Status { get; set; } = "New";
}