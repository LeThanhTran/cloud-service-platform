using System.Net;

namespace CloudService.Application.Emails;

public static class EmailTemplates
{
    public static string OrderCreated(
        string customerName,
        string referenceCode,
        string servicePlanName,
        string billingCycle) =>
        BuildLayout(
            "NovaCloud đã tiếp nhận yêu cầu dịch vụ",
            customerName,
            "Yêu cầu đăng ký dịch vụ của bạn đã được tiếp nhận thành công. Đội ngũ NovaCloud sẽ kiểm tra và cập nhật trạng thái trong thời gian sớm nhất.",
            new[]
            {
                ("Mã yêu cầu", referenceCode),
                ("Dịch vụ", servicePlanName),
                ("Chu kỳ", BillingCycleLabel(billingCycle)),
                ("Trạng thái", "Mới")
            },
            "Vui lòng lưu mã yêu cầu để thuận tiện khi tra cứu hoặc liên hệ hỗ trợ.");

    public static string ContactReceived(
        string fullName,
        string referenceCode,
        string subject) =>
        BuildLayout(
            "NovaCloud đã tiếp nhận liên hệ",
            fullName,
            "Nội dung liên hệ của bạn đã được gửi thành công. Đội ngũ NovaCloud sẽ phản hồi trong thời gian sớm nhất.",
            new[]
            {
                ("Mã liên hệ", referenceCode),
                ("Chủ đề", subject),
                ("Trạng thái", "Mới")
            },
            "Vui lòng lưu mã liên hệ để thuận tiện khi cần trao đổi thêm với NovaCloud.");

    public static string AffiliateReceived(
        string fullName,
        string referenceCode) =>
        BuildLayout(
            "NovaCloud đã tiếp nhận hồ sơ Affiliate",
            fullName,
            "Hồ sơ đăng ký đối tác/Affiliate của bạn đã được tiếp nhận. Đội ngũ NovaCloud sẽ xem xét và cập nhật trạng thái trong thời gian sớm nhất.",
            new[]
            {
                ("Mã hồ sơ", referenceCode),
                ("Trạng thái", "Mới")
            },
            "Vui lòng lưu mã hồ sơ để thuận tiện khi tra cứu hoặc liên hệ hỗ trợ.");

    public static string OrderStatus(
        string customerName,
        string referenceCode,
        string servicePlanName,
        string billingCycle,
        string status,
        string statusMessage) =>
        BuildLayout(
            "Cập nhật yêu cầu dịch vụ",
            customerName,
            statusMessage,
            new[]
            {
                ("Mã yêu cầu", referenceCode),
                ("Dịch vụ", servicePlanName),
                ("Chu kỳ", BillingCycleLabel(billingCycle)),
                ("Trạng thái", OrderStatusLabel(status))
            });

    public static string AffiliateStatus(
        string fullName,
        string referenceCode,
        string status,
        string statusMessage) =>
        BuildLayout(
            "Cập nhật hồ sơ Affiliate",
            fullName,
            statusMessage,
            new[]
            {
                ("Mã hồ sơ", referenceCode),
                ("Trạng thái", WorkflowStatusLabel(status))
            });

    public static string ContactStatus(
        string fullName,
        string referenceCode,
        string subject,
        string status,
        string statusMessage) =>
        BuildLayout(
            "Cập nhật yêu cầu liên hệ",
            fullName,
            statusMessage,
            new[]
            {
                ("Mã liên hệ", referenceCode),
                ("Chủ đề", subject),
                ("Trạng thái", ContactStatusLabel(status))
            });

    public static string RoleChanged(
        string fullName,
        string oldRole,
        string newRole) =>
        BuildLayout(
            "Quyền tài khoản đã được thay đổi",
            fullName,
            $"Quyền tài khoản NovaCloud của bạn đã được thay đổi từ {oldRole} sang {newRole}.",
            new[]
            {
                ("Quyền trước đây", oldRole),
                ("Quyền hiện tại", newRole)
            },
            "Nếu bạn đang đăng nhập, hãy đăng nhập lại để phiên làm việc phản ánh quyền mới nhất.");

    public static string AccountStatusChanged(
        string fullName,
        bool isActive) =>
        BuildLayout(
            isActive
                ? "Tài khoản đã được kích hoạt"
                : "Tài khoản đã bị tạm khóa",
            fullName,
            isActive
                ? "Tài khoản NovaCloud của bạn đã được quản trị viên kích hoạt lại."
                : "Tài khoản NovaCloud của bạn đã bị quản trị viên tạm khóa. Bạn sẽ không thể đăng nhập hoặc làm mới phiên cho đến khi tài khoản được mở lại.",
            new[]
            {
                ("Trạng thái", isActive ? "Đang hoạt động" : "Tạm khóa")
            },
            isActive
                ? "Bạn có thể đăng nhập lại để tiếp tục sử dụng NovaCloud."
                : "Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ quản trị viên NovaCloud.");

    public static string PasswordChanged(string fullName) =>
        BuildLayout(
            "Mật khẩu tài khoản đã được thay đổi",
            fullName,
            "Mật khẩu tài khoản NovaCloud của bạn vừa được thay đổi thành công.",
            Array.Empty<(string Label, string Value)>(),
            "Nếu bạn không thực hiện thay đổi này, hãy liên hệ quản trị viên NovaCloud ngay.");

    private static string BuildLayout(
        string heading,
        string recipientName,
        string message,
        IEnumerable<(string Label, string Value)> details,
        string? note = null)
    {
        var rows = string.Join(
            string.Empty,
            details.Select(detail =>
                $"<tr><td style=\"padding:8px 12px;color:#64748b;\">{E(detail.Label)}</td>" +
                $"<td style=\"padding:8px 12px;font-weight:600;color:#0f172a;\">{E(detail.Value)}</td></tr>"));

        var noteHtml = string.IsNullOrWhiteSpace(note)
            ? string.Empty
            : $"<div style=\"margin-top:20px;padding:12px 14px;background:#f8fafc;border-left:3px solid #2563eb;color:#475569;\">{E(note)}</div>";

        var tableHtml = string.IsNullOrEmpty(rows)
            ? string.Empty
            : $"<table style=\"width:100%;margin-top:18px;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;\">{rows}</table>";

        return $$"""
<!doctype html>
<html lang="vi">
<body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;background:#081b3f;color:#ffffff;">
        <div style="font-size:20px;font-weight:700;">NovaCloud</div>
        <div style="margin-top:4px;font-size:13px;color:#bfdbfe;">Cloud services management platform</div>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 16px;font-size:20px;">{{E(heading)}}</h2>
        <p>Xin chào <strong>{{E(recipientName)}}</strong>,</p>
        <p style="line-height:1.6;color:#334155;">{{E(message)}}</p>
        {{tableHtml}}
        {{noteHtml}}
        <p style="margin-top:24px;font-size:13px;color:#64748b;">Đây là email tự động từ NovaCloud. Bạn không cần trả lời email này.</p>
      </div>
    </div>
  </div>
</body>
</html>
""";
    }

    private static string E(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

    private static string BillingCycleLabel(string value) =>
        value.Equals("Monthly", StringComparison.OrdinalIgnoreCase) ? "Hàng tháng" :
        value.Equals("Yearly", StringComparison.OrdinalIgnoreCase) ? "Hàng năm" : value;

    private static string OrderStatusLabel(string value) => value switch
    {
        "Processing" => "Đang xử lý",
        "Completed" => "Hoàn tất",
        "Rejected" => "Từ chối",
        "New" => "Mới",
        _ => value
    };

    private static string WorkflowStatusLabel(string value) => value switch
    {
        "Processing" => "Đang xử lý",
        "Completed" => "Hoàn tất",
        "Rejected" => "Từ chối",
        "New" => "Mới",
        _ => value
    };

    private static string ContactStatusLabel(string value) => value switch
    {
        "Processing" => "Đang xử lý",
        "Resolved" => "Đã giải quyết",
        "New" => "Mới",
        _ => value
    };
}
