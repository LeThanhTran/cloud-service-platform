using System.Security.Claims;
using CloudService.Application.DTOs.Users;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.WebApi.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = AppRoles.Admin)]
public class UsersController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;
    private readonly IAuditLogService _auditLogService;

    public UsersController(
        IUserManagementService userManagementService,
        IAuditLogService auditLogService)
    {
        _userManagementService = userManagementService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _userManagementService.GetAllAsync();
        return Ok(users);
    }

    [HttpPut("{id:guid}/role")]
    public async Task<ActionResult<UserDto>> UpdateRole(
        Guid id,
        UpdateUserRoleDto dto)
    {
        var currentUserId = GetCurrentUserId();

        if (id == currentUserId)
        {
            throw new InvalidOperationException(
                "Bạn không thể thay đổi quyền của chính tài khoản đang đăng nhập.");
        }

        var before = (await _userManagementService.GetAllAsync())
            .FirstOrDefault(user => user.Id == id);

        var user = await _userManagementService.UpdateRoleAsync(id, dto);

        if (user == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy tài khoản.");
        }

        if (before != null &&
            !string.Equals(before.Role, user.Role, StringComparison.OrdinalIgnoreCase))
        {
            await _auditLogService.LogFromUserAsync(
                User,
                "CHANGE_ROLE",
                "AppUser",
                user.Id,
                user.Email,
                $"Thay đổi quyền tài khoản {user.FullName} ({user.Email}).",
                before.Role,
                user.Role);
        }

        return Ok(user);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<UserDto>> UpdateStatus(
        Guid id,
        UpdateUserStatusDto dto)
    {
        var currentUserId = GetCurrentUserId();

        if (id == currentUserId && !dto.IsActive)
        {
            throw new InvalidOperationException(
                "Bạn không thể vô hiệu hóa chính tài khoản đang đăng nhập.");
        }

        var before = (await _userManagementService.GetAllAsync())
            .FirstOrDefault(user => user.Id == id);

        var user = await _userManagementService.UpdateStatusAsync(id, dto);

        if (user == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy tài khoản.");
        }

        if (before != null && before.IsActive != user.IsActive)
        {
            await _auditLogService.LogFromUserAsync(
                User,
                "UPDATE_STATUS",
                "AppUser",
                user.Id,
                user.Email,
                user.IsActive
                    ? $"Kích hoạt lại tài khoản {user.FullName} ({user.Email})."
                    : $"Tạm khóa tài khoản {user.FullName} ({user.Email}).",
                before.IsActive ? "Active" : "Inactive",
                user.IsActive ? "Active" : "Inactive");
        }

        return Ok(user);
    }

    private Guid GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userId, out var parsedUserId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được tài khoản quản trị hiện tại.");
        }

        return parsedUserId;
    }
}
