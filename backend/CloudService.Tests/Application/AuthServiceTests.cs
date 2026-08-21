using CloudService.Application.DTOs.Auth;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace CloudService.Tests.Application;

public class AuthServiceTests
{
    private readonly Mock<IRepository<AppUser>> _users = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<IPasswordHasher<AppUser>> _passwordHasher = new();
    private readonly Mock<IJwtService> _jwt = new();
    private readonly Mock<INotificationService> _notifications = new();
    private readonly Mock<IEmailSender> _email = new();

    public AuthServiceTests()
    {
        _users.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(Array.Empty<AppUser>());
        _unitOfWork.Setup(unit => unit.SaveChangesAsync()).ReturnsAsync(1);
        _jwt.Setup(service => service.GenerateToken(It.IsAny<AppUser>()))
            .Returns("access-token");
        _passwordHasher
            .Setup(hasher => hasher.HashPassword(It.IsAny<AppUser>(), It.IsAny<string>()))
            .Returns("hashed-password");
        _notifications
            .Setup(service => service.CreateForUserByEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _email
            .Setup(service => service.SendAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
            .ReturnsAsync(true);
    }

    [Fact]
    public async Task RegisterAsync_NewEmail_CreatesUserWithUserRoleAndTokens()
    {
        AppUser? captured = null;
        _users.Setup(repository => repository.AddAsync(It.IsAny<AppUser>()))
            .Callback<AppUser>(user => captured = user)
            .Returns(Task.CompletedTask);

        var result = await CreateService().RegisterAsync(new RegisterDto
        {
            FullName = "  Nova Customer  ",
            Email = "  customer@example.com  ",
            Password = "123456"
        });

        Assert.NotNull(captured);
        Assert.Equal("Nova Customer", captured!.FullName);
        Assert.Equal("customer@example.com", captured.Email);
        Assert.Equal(AppRoles.User, captured.Role);
        Assert.True(captured.IsActive);
        Assert.Equal("hashed-password", captured.PasswordHash);
        Assert.False(string.IsNullOrWhiteSpace(captured.RefreshToken));
        Assert.True(captured.RefreshTokenExpiryTime > DateTime.UtcNow);
        Assert.Equal("access-token", result.Token);
        Assert.Equal(captured.RefreshToken, result.RefreshToken);

        _users.Verify(repository => repository.AddAsync(captured), Times.Once);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_IsRejectedCaseInsensitively()
    {
        _users.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { CreateUser("Customer@Example.com") });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateService().RegisterAsync(new RegisterDto
            {
                FullName = "Duplicate",
                Email = "customer@example.com",
                Password = "123456"
            }));

        _users.Verify(repository => repository.AddAsync(It.IsAny<AppUser>()), Times.Never);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_ValidPassword_RotatesRefreshTokenAndReturnsJwt()
    {
        var user = CreateUser("customer@example.com");
        user.PasswordHash = "stored-hash";
        user.RefreshToken = "old-refresh";

        _users.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[] { user });
        _passwordHasher
            .Setup(hasher => hasher.VerifyHashedPassword(user, "stored-hash", "correct"))
            .Returns(PasswordVerificationResult.Success);

        var result = await CreateService().LoginAsync(new LoginDto
        {
            Email = " customer@example.com ",
            Password = "correct"
        });

        Assert.NotNull(result);
        Assert.Equal("access-token", result!.Token);
        Assert.NotEqual("old-refresh", user.RefreshToken);
        Assert.Equal(user.RefreshToken, result.RefreshToken);
        _users.Verify(repository => repository.Update(user), Times.Once);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ReturnsNullWithoutSaving()
    {
        var user = CreateUser("customer@example.com");
        user.PasswordHash = "stored-hash";
        _users.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[] { user });
        _passwordHasher
            .Setup(hasher => hasher.VerifyHashedPassword(user, "stored-hash", "wrong"))
            .Returns(PasswordVerificationResult.Failed);

        var result = await CreateService().LoginAsync(new LoginDto
        {
            Email = user.Email,
            Password = "wrong"
        });

        Assert.Null(result);
        _users.Verify(repository => repository.Update(It.IsAny<AppUser>()), Times.Never);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_InactiveAccount_IsRejected()
    {
        var user = CreateUser("locked@example.com");
        user.IsActive = false;
        _users.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[] { user });

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateService().LoginAsync(new LoginDto
            {
                Email = user.Email,
                Password = "123456"
            }));

        Assert.Contains("vô hiệu hóa", exception.Message);
    }

    [Fact]
    public async Task RefreshTokenAsync_ValidToken_RotatesToken()
    {
        var user = CreateUser("customer@example.com");
        user.RefreshToken = "valid-refresh";
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(1);
        _users.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[] { user });

        var result = await CreateService().RefreshTokenAsync("valid-refresh");

        Assert.NotNull(result);
        Assert.NotEqual("valid-refresh", user.RefreshToken);
        Assert.Equal(user.RefreshToken, result!.RefreshToken);
        _users.Verify(repository => repository.Update(user), Times.Once);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task RefreshTokenAsync_ExpiredToken_ReturnsNull()
    {
        var user = CreateUser("customer@example.com");
        user.RefreshToken = "expired-refresh";
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddMinutes(-1);
        _users.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[] { user });

        var result = await CreateService().RefreshTokenAsync("expired-refresh");

        Assert.Null(result);
        _users.Verify(repository => repository.Update(It.IsAny<AppUser>()), Times.Never);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task ChangePasswordAsync_WrongCurrentPassword_IsRejected()
    {
        var user = CreateUser("customer@example.com");
        user.PasswordHash = "stored-hash";
        _users.Setup(repository => repository.GetByIdAsync(user.Id)).ReturnsAsync(user);
        _passwordHasher
            .Setup(hasher => hasher.VerifyHashedPassword(user, "stored-hash", "wrong-current"))
            .Returns(PasswordVerificationResult.Failed);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateService().ChangePasswordAsync(user.Id, new ChangePasswordDto
            {
                CurrentPassword = "wrong-current",
                NewPassword = "new-password"
            }));

        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task ChangePasswordAsync_SamePassword_IsRejected()
    {
        var user = CreateUser("customer@example.com");
        user.PasswordHash = "stored-hash";
        _users.Setup(repository => repository.GetByIdAsync(user.Id)).ReturnsAsync(user);
        _passwordHasher
            .Setup(hasher => hasher.VerifyHashedPassword(user, "stored-hash", "same-password"))
            .Returns(PasswordVerificationResult.Success);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateService().ChangePasswordAsync(user.Id, new ChangePasswordDto
            {
                CurrentPassword = "same-password",
                NewPassword = "same-password"
            }));

        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task ChangePasswordAsync_ValidChange_RevokesRefreshAndSendsSecurityMessages()
    {
        var user = CreateUser("customer@example.com");
        user.PasswordHash = "old-hash";
        user.RefreshToken = "refresh";
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(3);
        _users.Setup(repository => repository.GetByIdAsync(user.Id)).ReturnsAsync(user);

        _passwordHasher
            .Setup(hasher => hasher.VerifyHashedPassword(user, "old-hash", "current-password"))
            .Returns(PasswordVerificationResult.Success);
        _passwordHasher
            .Setup(hasher => hasher.VerifyHashedPassword(user, "old-hash", "new-password"))
            .Returns(PasswordVerificationResult.Failed);
        _passwordHasher
            .Setup(hasher => hasher.HashPassword(user, "new-password"))
            .Returns("new-hash");

        var result = await CreateService().ChangePasswordAsync(user.Id, new ChangePasswordDto
        {
            CurrentPassword = "current-password",
            NewPassword = "new-password"
        });

        Assert.True(result);
        Assert.Equal("new-hash", user.PasswordHash);
        Assert.Null(user.RefreshToken);
        Assert.Null(user.RefreshTokenExpiryTime);
        _notifications.Verify(service => service.CreateForUserByEmailAsync(
            user.Email,
            It.IsAny<string>(),
            It.IsAny<string>(),
            "Security",
            "/account/security"), Times.Once);
        _email.Verify(service => service.SendAsync(
            user.Email,
            It.IsAny<string>(),
            It.IsAny<string>()), Times.Once);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task RevokeRefreshTokenAsync_MissingUser_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _users.Setup(repository => repository.GetByIdAsync(id))
            .ReturnsAsync((AppUser?)null);

        var result = await CreateService().RevokeRefreshTokenAsync(id);

        Assert.False(result);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    private static AppUser CreateUser(string email) => new()
    {
        FullName = "Customer",
        Email = email,
        PasswordHash = "hash",
        Role = AppRoles.User,
        IsActive = true
    };

    private AuthService CreateService() => new(
        _users.Object,
        _unitOfWork.Object,
        _passwordHasher.Object,
        _jwt.Object,
        _notifications.Object,
        _email.Object);
}
