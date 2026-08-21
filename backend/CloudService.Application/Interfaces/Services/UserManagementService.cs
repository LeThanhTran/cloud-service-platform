using CloudService.Application.DTOs.Users;
using CloudService.Application.Emails;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class UserManagementService : IUserManagementService
{
    private readonly IRepository<AppUser> _userRepository;
    private readonly INotificationService _notificationService;
    private readonly IEmailSender _emailSender;
    private readonly IUnitOfWork _unitOfWork;

    public UserManagementService(
        IRepository<AppUser> userRepository,
        INotificationService notificationService,
        IEmailSender emailSender,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _notificationService = notificationService;
        _emailSender = emailSender;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync()
    {
        var users = await _userRepository.GetAllAsync();

        return users
            .OrderByDescending(x => x.CreatedAt)
            .ThenBy(x => x.FullName)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<UserDto?> UpdateRoleAsync(
        Guid userId,
        UpdateUserRoleDto dto)
    {
        if (!AppRoles.TryNormalize(dto.Role?.Trim(), out var normalizedRole))
        {
            throw new ArgumentException(
                $"Role không hợp lệ. Chỉ chấp nhận: {AppRoles.Admin}, {AppRoles.Editor}, {AppRoles.User}.");
        }

        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return null;

        var previousRole = user.Role;
        var roleChanged = !string.Equals(
            previousRole,
            normalizedRole,
            StringComparison.OrdinalIgnoreCase);

        if (!roleChanged)
            return MapToDto(user);

        if (user.IsActive &&
            string.Equals(previousRole, AppRoles.Admin, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(normalizedRole, AppRoles.Admin, StringComparison.OrdinalIgnoreCase))
        {
            await EnsureAnotherActiveAdminExistsAsync(user.Id);
        }

        user.Role = normalizedRole;
        user.UpdatedAt = DateTime.UtcNow;

        // Role thay đổi làm phiên cũ không còn đáng tin cậy.
        // Thu hồi refresh token; access token cũng được kiểm tra role hiện tại
        // ở JwtBearer OnTokenValidated trong WebApi.
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();

        var destination = GetDestinationForRole(normalizedRole);

        await _notificationService.CreateForUserByEmailAsync(
            user.Email,
            "Quyền tài khoản đã thay đổi",
            $"Quyền tài khoản của bạn đã được thay đổi từ {previousRole} sang {normalizedRole}.",
            "Security",
            destination);

        await _emailSender.SendAsync(
            user.Email,
            "[NovaCloud] Quyền tài khoản của bạn đã được thay đổi",
            EmailTemplates.RoleChanged(
                user.FullName,
                previousRole,
                normalizedRole));

        return MapToDto(user);
    }

    public async Task<UserDto?> UpdateStatusAsync(
        Guid userId,
        UpdateUserStatusDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return null;

        if (user.IsActive == dto.IsActive)
            return MapToDto(user);

        if (!dto.IsActive &&
            string.Equals(user.Role, AppRoles.Admin, StringComparison.OrdinalIgnoreCase))
        {
            await EnsureAnotherActiveAdminExistsAsync(user.Id);
        }

        user.IsActive = dto.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        // Khóa/mở tài khoản luôn thu hồi refresh token cũ.
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();

        if (dto.IsActive)
        {
            await _notificationService.CreateForUserByEmailAsync(
                user.Email,
                "Tài khoản đã được kích hoạt",
                "Tài khoản NovaCloud của bạn đã được quản trị viên kích hoạt lại.",
                "Security",
                GetDestinationForRole(user.Role));
        }

        await _emailSender.SendAsync(
            user.Email,
            dto.IsActive
                ? "[NovaCloud] Tài khoản của bạn đã được kích hoạt"
                : "[NovaCloud] Tài khoản của bạn đã bị tạm khóa",
            EmailTemplates.AccountStatusChanged(
                user.FullName,
                dto.IsActive));

        return MapToDto(user);
    }

    private async Task EnsureAnotherActiveAdminExistsAsync(Guid excludedUserId)
    {
        var activeAdmins = (await _userRepository.GetAllAsync())
            .Count(candidate =>
                candidate.Id != excludedUserId &&
                candidate.IsActive &&
                string.Equals(
                    candidate.Role,
                    AppRoles.Admin,
                    StringComparison.OrdinalIgnoreCase));

        if (activeAdmins == 0)
        {
            throw new InvalidOperationException(
                "Không thể thay đổi Admin cuối cùng đang hoạt động. Hãy cấp quyền Admin cho tài khoản khác trước.");
        }
    }

    private static string GetDestinationForRole(string role) =>
        string.Equals(role, AppRoles.User, StringComparison.OrdinalIgnoreCase)
            ? "/account"
            : "/admin/dashboard";

    private static UserDto MapToDto(AppUser user)
    {
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = DateTime.SpecifyKind(user.CreatedAt, DateTimeKind.Utc),
            UpdatedAt = user.UpdatedAt.HasValue
                ? DateTime.SpecifyKind(user.UpdatedAt.Value, DateTimeKind.Utc)
                : null
        };
    }
}
