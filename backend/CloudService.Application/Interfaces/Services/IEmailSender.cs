namespace CloudService.Application.Interfaces.Services;

public interface IEmailSender
{
    Task<bool> SendAsync(
        string toEmail,
        string subject,
        string htmlBody);
}
