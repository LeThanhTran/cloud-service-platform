using CloudService.Application.DTOs.Notifications;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class NotificationService : INotificationService
{
    private const int MaxLimit = 50;

    private readonly IRepository<Notification> _notificationRepository;
    private readonly IRepository<AppUser> _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(
        IRepository<Notification> notificationRepository,
        IRepository<AppUser> userRepository,
        IUnitOfWork unitOfWork)
    {
        _notificationRepository = notificationRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyCollection<NotificationDto>> GetForUserAsync(
        Guid userId,
        bool unreadOnly = false,
        int limit = 20)
    {
        ValidateUserId(userId);

        if (limit < 1 || limit > MaxLimit)
            throw new ArgumentException($"Limit phải nằm trong khoảng từ 1 đến {MaxLimit}.");

        var notifications = (await _notificationRepository.GetAllAsync())
            .Where(notification => notification.UserId == userId);

        if (unreadOnly)
            notifications = notifications.Where(notification => !notification.IsRead);

        return notifications
            .OrderByDescending(notification => notification.CreatedAt)
            .Take(limit)
            .Select(Map)
            .ToArray();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        ValidateUserId(userId);

        return (await _notificationRepository.GetAllAsync())
            .Count(notification =>
                notification.UserId == userId &&
                !notification.IsRead);
    }

    public async Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        ValidateUserId(userId);

        var notification = await _notificationRepository.GetByIdAsync(notificationId);

        if (notification == null || notification.UserId != userId)
            return false;

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
            _notificationRepository.Update(notification);
            await _unitOfWork.SaveChangesAsync();
        }

        return true;
    }

    public async Task<int> MarkAllAsReadAsync(Guid userId)
    {
        ValidateUserId(userId);

        var unread = (await _notificationRepository.GetAllAsync())
            .Where(notification =>
                notification.UserId == userId &&
                !notification.IsRead)
            .ToList();

        if (unread.Count == 0)
            return 0;

        foreach (var notification in unread)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
            _notificationRepository.Update(notification);
        }

        await _unitOfWork.SaveChangesAsync();
        return unread.Count;
    }

    public async Task CreateForRolesAsync(
        IEnumerable<string> roles,
        string title,
        string message,
        string type,
        string link)
    {
        var normalizedRoles = roles
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => role.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (normalizedRoles.Count == 0)
            return;

        var recipients = (await _userRepository.GetAllAsync())
            .Where(user =>
                user.IsActive &&
                normalizedRoles.Contains(user.Role))
            .ToList();

        if (recipients.Count == 0)
            return;

        foreach (var user in recipients)
        {
            await _notificationRepository.AddAsync(
                CreateNotification(user.Id, title, message, type, link));
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task CreateForUserByEmailAsync(
        string email,
        string title,
        string message,
        string type,
        string link)
    {
        if (string.IsNullOrWhiteSpace(email))
            return;

        var normalizedEmail = email.Trim();

        var user = (await _userRepository.GetAllAsync())
            .FirstOrDefault(candidate =>
                candidate.IsActive &&
                string.Equals(
                    candidate.Email,
                    normalizedEmail,
                    StringComparison.OrdinalIgnoreCase));

        if (user == null)
            return;

        await _notificationRepository.AddAsync(
            CreateNotification(user.Id, title, message, type, link));

        await _unitOfWork.SaveChangesAsync();
    }

    private static Notification CreateNotification(
        Guid userId,
        string title,
        string message,
        string type,
        string link)
    {
        return new Notification
        {
            UserId = userId,
            Title = NormalizeRequired(title, "Tiêu đề"),
            Message = NormalizeRequired(message, "Nội dung"),
            Type = NormalizeRequired(type, "Loại thông báo"),
            Link = NormalizeRequired(link, "Đường dẫn"),
            IsRead = false
        };
    }

    private static string NormalizeRequired(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{fieldName} thông báo không được để trống.");

        return value.Trim();
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại.");
    }

    private static NotificationDto Map(Notification notification) => new()
    {
        Id = notification.Id,
        Title = notification.Title,
        Message = notification.Message,
        Type = notification.Type,
        Link = notification.Link,
        IsRead = notification.IsRead,
        CreatedAt = notification.CreatedAt
    };
}
