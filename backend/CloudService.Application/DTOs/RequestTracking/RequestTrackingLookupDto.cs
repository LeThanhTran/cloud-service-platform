using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.RequestTracking;

public class RequestTrackingLookupDto
{
    [Required, MaxLength(30)]
    public string ReferenceCode { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;
}
