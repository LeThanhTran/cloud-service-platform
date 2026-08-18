using CloudService.Application.DTOs.Users;

namespace CloudService.Application.Interfaces.Services;

public interface IUserManagementService
{
    Task<IEnumerable<UserDto>> GetAllAsync();

    Task<UserDto?> UpdateRoleAsync(Guid userId, UpdateUserRoleDto dto);
}
