using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.DTOs.Auth;

public class RegisterDto
{
    [Required(ErrorMessage = "Họ tên không được để trống.")]
    [StringLength(100, ErrorMessage = "Họ tên tối đa 100 ký tự.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email không được để trống.")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
    [StringLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được để trống.")]
    [StringLength(100, MinimumLength = 6,
        ErrorMessage = "Mật khẩu phải từ 6 đến 100 ký tự.")]
    public string Password { get; set; } = string.Empty;
}