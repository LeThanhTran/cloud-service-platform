using System.Security.Cryptography;
using CloudService.Application.DTOs.Auth;
using CloudService.Application.Emails;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace CloudService.Application.Interfaces.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<AppUser> _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher<AppUser> _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly INotificationService _notificationService;
    private readonly IEmailSender _emailSender;

    public AuthService(
        IRepository<AppUser> userRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasher<AppUser> passwordHasher,
        IJwtService jwtService,
        INotificationService notificationService,
        IEmailSender emailSender)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _notificationService = notificationService;
        _emailSender = emailSender;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var users = await _userRepository.GetAllAsync();

        var existingUser = users.FirstOrDefault(u =>
            u.Email.Equals(dto.Email, StringComparison.OrdinalIgnoreCase));

        if (existingUser != null)
            throw new InvalidOperationException("Email đã được sử dụng.");

        var user = new AppUser
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim(),
            Role = AppRoles.User,
            IsActive = true
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
        SetNewRefreshToken(user);

        await _userRepository.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var users = await _userRepository.GetAllAsync();

        var user = users.FirstOrDefault(u =>
            u.Email.Equals(dto.Email.Trim(), StringComparison.OrdinalIgnoreCase));

        if (user == null)
            return null;

        if (!user.IsActive)
            throw new InvalidOperationException("Tài khoản đã bị vô hiệu hóa.");

        var result = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            dto.Password);

        if (result == PasswordVerificationResult.Failed)
            return null;

        // Mỗi lần đăng nhập sẽ tạo refresh token mới,
        // refresh token trước đó tự động không còn hợp lệ.
        SetNewRefreshToken(user);
        _userRepository.Update(user);

        await _unitOfWork.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return null;

        var users = await _userRepository.GetAllAsync();

        var user = users.FirstOrDefault(u =>
            u.RefreshToken == refreshToken);

        if (user == null || !user.IsActive)
            return null;

        if (user.RefreshTokenExpiryTime == null ||
            user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return null;
        }

        // Refresh Token Rotation: cấp cặp token mới và vô hiệu token cũ.
        SetNewRefreshToken(user);
        _userRepository.Update(user);

        await _unitOfWork.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public async Task<bool> ChangePasswordAsync(
        Guid userId,
        ChangePasswordDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return false;

        if (!user.IsActive)
            throw new InvalidOperationException("Tài khoản đã bị vô hiệu hóa.");

        var verifyResult = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            dto.CurrentPassword);

        if (verifyResult == PasswordVerificationResult.Failed)
            throw new InvalidOperationException("Mật khẩu hiện tại không đúng.");

        var samePasswordResult = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            dto.NewPassword);

        if (samePasswordResult != PasswordVerificationResult.Failed)
        {
            throw new InvalidOperationException(
                "Mật khẩu mới phải khác mật khẩu hiện tại.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);

        // Đổi mật khẩu sẽ thu hồi refresh token hiện tại.
        // Access token đã cấp vẫn hết hạn theo thời gian sống JWT.
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();

        var securityLink = string.Equals(
            user.Role,
            AppRoles.User,
            StringComparison.OrdinalIgnoreCase)
            ? "/account/security"
            : "/admin/settings/security";

        await _notificationService.CreateForUserByEmailAsync(
            user.Email,
            "Mật khẩu đã được thay đổi",
            "Mật khẩu tài khoản NovaCloud của bạn vừa được thay đổi thành công.",
            "Security",
            securityLink);

        await _emailSender.SendAsync(
            user.Email,
            "[NovaCloud] Mật khẩu tài khoản đã được thay đổi",
            EmailTemplates.PasswordChanged(user.FullName));

        return true;
    }

    public async Task<bool> RevokeRefreshTokenAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return false;

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    private AuthResponseDto CreateAuthResponse(AppUser user)
    {
        return new AuthResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            Token = _jwtService.GenerateToken(user),
            RefreshToken = user.RefreshToken ?? string.Empty
        };
    }

    private static void SetNewRefreshToken(AppUser user)
    {
        user.RefreshToken = GenerateRefreshToken();
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
    }
}
