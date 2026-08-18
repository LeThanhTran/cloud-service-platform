using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.Users;

public class UpdateUserRoleDto
{
    [Required(ErrorMessage = "Role không được để trống.")]
    public string Role { get; set; } = string.Empty;
}
