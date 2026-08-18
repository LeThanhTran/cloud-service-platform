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
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _userManagementService.GetAllAsync();
        return Ok(users);
    }

    // PUT: api/Users/{id}/role
    [HttpPut("{id:guid}/role")]
    public async Task<ActionResult<UserDto>> UpdateRole(
        Guid id,
        UpdateUserRoleDto dto)
    {
        var user = await _userManagementService.UpdateRoleAsync(id, dto);

        if (user == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy tài khoản.");
        }

        return Ok(user);
    }
}
