using CloudService.Application.DTOs.Auth;

namespace CloudService.Application.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);

    Task<AuthResponseDto?> LoginAsync(LoginDto dto);

    Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken);

    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordDto dto);

    Task<bool> RevokeRefreshTokenAsync(Guid userId);
}
