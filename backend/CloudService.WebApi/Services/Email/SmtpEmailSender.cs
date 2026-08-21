using System.Net;
using System.Net.Mail;
using System.Text;
using CloudService.Application.Interfaces.Services;

namespace CloudService.WebApi.Services.Email;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(
        IConfiguration configuration,
        ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendAsync(
        string toEmail,
        string subject,
        string htmlBody)
    {
        var enabled = _configuration.GetValue<bool>("Email:Enabled");
        if (!enabled)
        {
            _logger.LogInformation(
                "Email sending is disabled. Skipping email to {Recipient} with subject {Subject}.",
                toEmail,
                subject);
            return false;
        }

        var host = _configuration["Email:SmtpHost"]?.Trim();
        var port = _configuration.GetValue<int?>("Email:SmtpPort") ?? 587;
        var useSsl = _configuration.GetValue<bool?>("Email:UseSsl") ?? true;
        var senderName = _configuration["Email:SenderName"]?.Trim() ?? "NovaCloud";
        var senderEmail = _configuration["Email:SenderEmail"]?.Trim();
        var username = _configuration["Email:Username"]?.Trim();
        var password = _configuration["Email:Password"];

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(senderEmail) ||
            string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning(
                "Email is enabled but SMTP settings are incomplete. Email to {Recipient} was skipped.",
                toEmail);
            return false;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName, Encoding.UTF8),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
                SubjectEncoding = Encoding.UTF8,
                BodyEncoding = Encoding.UTF8
            };

            message.To.Add(new MailAddress(toEmail.Trim()));

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = useSsl,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(username, password)
            };

            await client.SendMailAsync(message);

            _logger.LogInformation(
                "Email sent successfully to {Recipient} with subject {Subject}.",
                toEmail,
                subject);
            return true;
        }
        catch (Exception exception)
        {
            // Email is an out-of-band notification. A temporary SMTP failure must
            // not roll back a successfully saved Order/Affiliate/Contact/Role update.
            _logger.LogError(
                exception,
                "Failed to send email to {Recipient} with subject {Subject}.",
                toEmail,
                subject);
            return false;
        }
    }
}
