using CloudService.Domain.Common;
using CloudService.Domain.Constants;

namespace CloudService.Domain.Entities;

public class AppUser : BaseEntity
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = AppRoles.User;

    public bool IsActive { get; set; } = true;

    // Refresh Token
    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiryTime { get; set; }
}