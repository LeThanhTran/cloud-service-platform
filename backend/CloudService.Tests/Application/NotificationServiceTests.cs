using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using Moq;

namespace CloudService.Tests.Application;

public class NotificationServiceTests
{
    private readonly Mock<IRepository<Notification>> _notifications = new();
    private readonly Mock<IRepository<AppUser>> _users = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    public NotificationServiceTests()
    {
        _notifications.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(Array.Empty<Notification>());
        _users.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(Array.Empty<AppUser>());
        _unitOfWork.Setup(unit => unit.SaveChangesAsync()).ReturnsAsync(1);
    }

    [Fact]
    public async Task GetForUserAsync_UnreadOnly_ReturnsNewestUnreadForOwner()
    {
        var userId = Guid.NewGuid();
        var older = CreateNotification(userId, false, DateTime.UtcNow.AddMinutes(-5));
        var newest = CreateNotification(userId, false, DateTime.UtcNow);
        var read = CreateNotification(userId, true, DateTime.UtcNow.AddMinutes(1));
        var other = CreateNotification(Guid.NewGuid(), false, DateTime.UtcNow.AddMinutes(2));

        _notifications.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { older, newest, read, other });

        var result = await CreateService().GetForUserAsync(userId, unreadOnly: true, limit: 2);

        Assert.Equal(2, result.Count);
        Assert.Equal(newest.Id, result.First().Id);
        Assert.DoesNotContain(result, item => item.Id == read.Id || item.Id == other.Id);
    }

    [Fact]
    public async Task GetForUserAsync_InvalidLimit_IsRejected()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            CreateService().GetForUserAsync(Guid.NewGuid(), limit: 51));
    }

    [Fact]
    public async Task GetForUserAsync_EmptyUserId_IsUnauthorized()
    {
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            CreateService().GetForUserAsync(Guid.Empty));
    }

    [Fact]
    public async Task GetUnreadCountAsync_CountsOnlyUnreadForOwner()
    {
        var userId = Guid.NewGuid();
        _notifications.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[]
            {
                CreateNotification(userId, false, DateTime.UtcNow),
                CreateNotification(userId, true, DateTime.UtcNow),
                CreateNotification(Guid.NewGuid(), false, DateTime.UtcNow)
            });

        var result = await CreateService().GetUnreadCountAsync(userId);

        Assert.Equal(1, result);
    }

    [Fact]
    public async Task MarkAsReadAsync_OwnUnreadNotification_UpdatesAndSaves()
    {
        var userId = Guid.NewGuid();
        var notification = CreateNotification(userId, false, DateTime.UtcNow);
        _notifications.Setup(repository => repository.GetByIdAsync(notification.Id))
            .ReturnsAsync(notification);

        var result = await CreateService().MarkAsReadAsync(notification.Id, userId);

        Assert.True(result);
        Assert.True(notification.IsRead);
        Assert.NotNull(notification.UpdatedAt);
        _notifications.Verify(repository => repository.Update(notification), Times.Once);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task MarkAsReadAsync_ForeignNotification_ReturnsFalse()
    {
        var notification = CreateNotification(Guid.NewGuid(), false, DateTime.UtcNow);
        _notifications.Setup(repository => repository.GetByIdAsync(notification.Id))
            .ReturnsAsync(notification);

        var result = await CreateService().MarkAsReadAsync(notification.Id, Guid.NewGuid());

        Assert.False(result);
        _notifications.Verify(repository => repository.Update(It.IsAny<Notification>()), Times.Never);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task MarkAllAsReadAsync_UpdatesAllUnreadForOwner()
    {
        var userId = Guid.NewGuid();
        var first = CreateNotification(userId, false, DateTime.UtcNow);
        var second = CreateNotification(userId, false, DateTime.UtcNow);
        var alreadyRead = CreateNotification(userId, true, DateTime.UtcNow);
        var other = CreateNotification(Guid.NewGuid(), false, DateTime.UtcNow);

        _notifications.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { first, second, alreadyRead, other });

        var result = await CreateService().MarkAllAsReadAsync(userId);

        Assert.Equal(2, result);
        Assert.True(first.IsRead);
        Assert.True(second.IsRead);
        Assert.False(other.IsRead);
        _notifications.Verify(repository => repository.Update(It.IsAny<Notification>()), Times.Exactly(2));
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateForRolesAsync_CreatesOnlyForActiveMatchingRoles()
    {
        var admin = CreateUser("admin@example.com", AppRoles.Admin, true);
        var editor = CreateUser("editor@example.com", AppRoles.Editor, true);
        var inactiveAdmin = CreateUser("inactive@example.com", AppRoles.Admin, false);
        var customer = CreateUser("user@example.com", AppRoles.User, true);

        _users.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { admin, editor, inactiveAdmin, customer });

        var captured = new List<Notification>();
        _notifications
            .Setup(repository => repository.AddAsync(It.IsAny<Notification>()))
            .Callback<Notification>(captured.Add)
            .Returns(Task.CompletedTask);

        await CreateService().CreateForRolesAsync(
            new[] { "admin", "EDITOR" },
            " Title ",
            " Message ",
            " Security ",
            " /admin ");

        Assert.Equal(2, captured.Count);
        Assert.Contains(captured, item => item.UserId == admin.Id);
        Assert.Contains(captured, item => item.UserId == editor.Id);
        Assert.All(captured, item => Assert.False(item.IsRead));
        Assert.All(captured, item => Assert.Equal("Title", item.Title));
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateForUserByEmailAsync_MatchesActiveUserCaseInsensitively()
    {
        var user = CreateUser("Customer@Example.com", AppRoles.User, true);
        _users.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[] { user });

        Notification? captured = null;
        _notifications
            .Setup(repository => repository.AddAsync(It.IsAny<Notification>()))
            .Callback<Notification>(item => captured = item)
            .Returns(Task.CompletedTask);

        await CreateService().CreateForUserByEmailAsync(
            " customer@example.com ",
            "Thông báo",
            "Nội dung",
            "Order",
            "/account/requests");

        Assert.NotNull(captured);
        Assert.Equal(user.Id, captured!.UserId);
        Assert.Equal("Order", captured.Type);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateForUserByEmailAsync_UnknownEmail_DoesNotSave()
    {
        _users.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { CreateUser("other@example.com", AppRoles.User, true) });

        await CreateService().CreateForUserByEmailAsync(
            "missing@example.com",
            "Title",
            "Message",
            "Order",
            "/account/requests");

        _notifications.Verify(repository => repository.AddAsync(It.IsAny<Notification>()), Times.Never);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    private static Notification CreateNotification(Guid userId, bool isRead, DateTime createdAt) => new()
    {
        UserId = userId,
        Title = "Title",
        Message = "Message",
        Type = "Info",
        Link = "/",
        IsRead = isRead,
        CreatedAt = createdAt
    };

    private static AppUser CreateUser(string email, string role, bool active) => new()
    {
        FullName = email.Split('@')[0],
        Email = email,
        Role = role,
        IsActive = active
    };

    private NotificationService CreateService() => new(
        _notifications.Object,
        _users.Object,
        _unitOfWork.Object);
}
