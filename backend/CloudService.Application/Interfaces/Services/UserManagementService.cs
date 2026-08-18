using CloudService.Application.DTOs.Users;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class UserManagementService : IUserManagementService
{
    private readonly IRepository<AppUser> _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UserManagementService(
        IRepository<AppUser> userRepository,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
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

        user.Role = normalizedRole;
        _userRepository.Update(user);

        await _unitOfWork.SaveChangesAsync();

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
