using CloudService.Application.DTOs.Users;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using Moq;

namespace CloudService.Tests.Application;

public class UserManagementServiceTests
{
    private readonly Mock<IRepository<AppUser>> _users = new();
    private readonly Mock<INotificationService> _notifications = new();
    private readonly Mock<IEmailSender> _email = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    public UserManagementServiceTests()
    {
        _users.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(Array.Empty<AppUser>());

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

        _unitOfWork
            .Setup(unitOfWork => unitOfWork.SaveChangesAsync())
            .ReturnsAsync(1);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsNewestUsersFirst()
    {
        var older = CreateUser("older@example.com", AppRoles.User);
        older.CreatedAt = DateTime.UtcNow.AddDays(-2);

        var newer = CreateUser("newer@example.com", AppRoles.Editor);
        newer.CreatedAt = DateTime.UtcNow.AddDays(-1);

        _users.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { older, newer });

        var result = (await CreateService().GetAllAsync()).ToList();

        Assert.Equal(2, result.Count);
        Assert.Equal(newer.Id, result[0].Id);
        Assert.Equal(older.Id, result[1].Id);
        Assert.Equal(newer.CreatedAt, result[0].CreatedAt);
    }

    [Fact]
    public async Task UpdateRoleAsync_UserToEditor_RevokesSessionAndNotifies()
    {
        var user = CreateUser("customer@example.com", AppRoles.User);
        user.RefreshToken = "old-refresh";
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(3);

        _users.Setup(repository => repository.GetByIdAsync(user.Id))
            .ReturnsAsync(user);

        var result = await CreateService().UpdateRoleAsync(
            user.Id,
            new UpdateUserRoleDto { Role = AppRoles.Editor });

        Assert.NotNull(result);
        Assert.Equal(AppRoles.Editor, result!.Role);
        Assert.Equal(AppRoles.Editor, user.Role);
        Assert.Null(user.RefreshToken);
        Assert.Null(user.RefreshTokenExpiryTime);
        Assert.NotNull(user.UpdatedAt);

        _users.Verify(repository => repository.Update(user), Times.Once);
        _unitOfWork.Verify(unitOfWork => unitOfWork.SaveChangesAsync(), Times.Once);
        _notifications.Verify(service => service.CreateForUserByEmailAsync(
            user.Email,
            It.IsAny<string>(),
            It.IsAny<string>(),
            "Security",
            "/admin/dashboard"), Times.Once);
        _email.Verify(service => service.SendAsync(
            user.Email,
            It.IsAny<string>(),
            It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task UpdateRoleAsync_InvalidRole_IsRejected()
    {
        await Assert.ThrowsAsync<ArgumentException>(
            () => CreateService().UpdateRoleAsync(
                Guid.NewGuid(),
                new UpdateUserRoleDto { Role = "SuperAdmin" }));
    }

    [Fact]
    public async Task UpdateRoleAsync_LastActiveAdmin_CannotBeDemoted()
    {
        var admin = CreateUser("admin@example.com", AppRoles.Admin);

        _users.Setup(repository => repository.GetByIdAsync(admin.Id))
            .ReturnsAsync(admin);
        _users.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { admin });

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => CreateService().UpdateRoleAsync(
                admin.Id,
                new UpdateUserRoleDto { Role = AppRoles.Editor }));

        Assert.Contains("Admin cuối cùng", exception.Message);
        Assert.Equal(AppRoles.Admin, admin.Role);
        _unitOfWork.Verify(unitOfWork => unitOfWork.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_DeactivateUser_RevokesSessionAndSendsEmail()
    {
        var user = CreateUser("customer@example.com", AppRoles.User);
        user.RefreshToken = "refresh-token";
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        _users.Setup(repository => repository.GetByIdAsync(user.Id))
            .ReturnsAsync(user);

        var result = await CreateService().UpdateStatusAsync(
            user.Id,
            new UpdateUserStatusDto { IsActive = false });

        Assert.NotNull(result);
        Assert.False(result!.IsActive);
        Assert.False(user.IsActive);
        Assert.Null(user.RefreshToken);
        Assert.Null(user.RefreshTokenExpiryTime);

        _notifications.Verify(service => service.CreateForUserByEmailAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>()), Times.Never);
        _email.Verify(service => service.SendAsync(
            user.Email,
            It.IsAny<string>(),
            It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_ReactivateUser_NotifiesAndSendsEmail()
    {
        var user = CreateUser("customer@example.com", AppRoles.User);
        user.IsActive = false;

        _users.Setup(repository => repository.GetByIdAsync(user.Id))
            .ReturnsAsync(user);

        var result = await CreateService().UpdateStatusAsync(
            user.Id,
            new UpdateUserStatusDto { IsActive = true });

        Assert.NotNull(result);
        Assert.True(result!.IsActive);

        _notifications.Verify(service => service.CreateForUserByEmailAsync(
            user.Email,
            It.IsAny<string>(),
            It.IsAny<string>(),
            "Security",
            "/account"), Times.Once);
        _email.Verify(service => service.SendAsync(
            user.Email,
            It.IsAny<string>(),
            It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_LastActiveAdmin_CannotBeDeactivated()
    {
        var admin = CreateUser("admin@example.com", AppRoles.Admin);

        _users.Setup(repository => repository.GetByIdAsync(admin.Id))
            .ReturnsAsync(admin);
        _users.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { admin });

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => CreateService().UpdateStatusAsync(
                admin.Id,
                new UpdateUserStatusDto { IsActive = false }));

        Assert.Contains("Admin cuối cùng", exception.Message);
        Assert.True(admin.IsActive);
        _unitOfWork.Verify(unitOfWork => unitOfWork.SaveChangesAsync(), Times.Never);
    }

    private static AppUser CreateUser(string email, string role) => new()
    {
        FullName = email.Split('@')[0],
        Email = email,
        Role = role,
        IsActive = true
    };

    private UserManagementService CreateService() => new(
        _users.Object,
        _notifications.Object,
        _email.Object,
        _unitOfWork.Object);
}
