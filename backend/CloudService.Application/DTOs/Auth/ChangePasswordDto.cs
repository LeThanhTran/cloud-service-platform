using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.Auth;

public class ChangePasswordDto
{
    [Required(ErrorMessage = "Mật khẩu hiện tại không được để trống.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới không được để trống.")]
    [StringLength(100, MinimumLength = 6,
        ErrorMessage = "Mật khẩu mới phải từ 6 đến 100 ký tự.")]
    public string NewPassword { get; set; } = string.Empty;
}
