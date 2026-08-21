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
            .OrderBy(x => x.FullName)
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

        user.Role = normalizedRole;
        _userRepository.Update(user);

        await _unitOfWork.SaveChangesAsync();

        var destination = string.Equals(
            normalizedRole,
            AppRoles.User,
            StringComparison.OrdinalIgnoreCase)
            ? "/account"
            : "/admin/dashboard";

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

    private static UserDto MapToDto(AppUser user)
    {
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive
        };
    }
}
