using CloudService.Application.DTOs.Users;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = AppRoles.Admin)]
public class UsersController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;

    public UsersController(IUserManagementService userManagementService)
    {
        _userManagementService = userManagementService;
    }

    // GET: api/Users
    // Chỉ Admin được xem danh sách tài khoản để quản lý role.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _userManagementService.GetAllAsync();
        return Ok(users);
    }

    // PUT: api/Users/{id}/role
    // Cho phép Admin gán một trong ba role: Admin, Editor, User.
    [HttpPut("{id:guid}/role")]
    public async Task<ActionResult<UserDto>> UpdateRole(
        Guid id,
        UpdateUserRoleDto dto)
    {
        try
        {
            var user = await _userManagementService.UpdateRoleAsync(id, dto);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy tài khoản." });

            return Ok(user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
