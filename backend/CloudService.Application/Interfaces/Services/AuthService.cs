using CloudService.Application.DTOs.Auth;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace CloudService.Application.Interfaces.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<AppUser> _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher<AppUser> _passwordHasher;
    private readonly IJwtService _jwtService;

    public AuthService(
        IRepository<AppUser> userRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasher<AppUser> passwordHasher,
        IJwtService jwtService)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var users = await _userRepository.GetAllAsync();

        var existingUser = users.FirstOrDefault(u =>
            u.Email.ToLower() == dto.Email.ToLower());

        if (existingUser != null)
            throw new InvalidOperationException("Email đã được sử dụng.");

        var user = new AppUser
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Role = "User",
            IsActive = true
        };

        user.PasswordHash =
            _passwordHasher.HashPassword(user, dto.Password);

        await _userRepository.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user);

        return new AuthResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            Token = token
        };
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var users = await _userRepository.GetAllAsync();

        var user = users.FirstOrDefault(u =>
            u.Email.ToLower() == dto.Email.ToLower());

        if (user == null)
            return null;

        if (!user.IsActive)
            throw new InvalidOperationException("Tài khoản đã bị vô hiệu hóa.");

        var result = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            dto.Password);

        if (result == PasswordVerificationResult.Failed)
            return null;

        var token = _jwtService.GenerateToken(user);

        return new AuthResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            Token = token
        };
    }
}