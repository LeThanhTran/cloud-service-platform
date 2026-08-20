using CloudService.Application.DTOs.Notifications;

namespace CloudService.Application.Interfaces.Services;

public interface INotificationService
{
    Task<IReadOnlyCollection<NotificationDto>> GetForUserAsync(
        Guid userId,
        bool unreadOnly = false,
        int limit = 20);

    Task<int> GetUnreadCountAsync(Guid userId);

    Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId);

    Task<int> MarkAllAsReadAsync(Guid userId);

    Task CreateForRolesAsync(
        IEnumerable<string> roles,
        string title,
        string message,
        string type,
        string link);

    Task CreateForUserByEmailAsync(
        string email,
        string title,
        string message,
        string type,
        string link);
}
