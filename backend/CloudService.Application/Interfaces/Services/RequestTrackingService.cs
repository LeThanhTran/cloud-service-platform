using CloudService.Application.DTOs.RequestTracking;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Utilities;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class RequestTrackingService : IRequestTrackingService
{
    private readonly IRepository<OrderRequest> _orderRepository;
    private readonly IRepository<AffiliateApplication> _affiliateRepository;
    private readonly IRepository<ContactRequest> _contactRepository;
    private readonly IRepository<ServicePlan> _servicePlanRepository;

    public RequestTrackingService(
        IRepository<OrderRequest> orderRepository,
        IRepository<AffiliateApplication> affiliateRepository,
        IRepository<ContactRequest> contactRepository,
        IRepository<ServicePlan> servicePlanRepository)
    {
        _orderRepository = orderRepository;
        _affiliateRepository = affiliateRepository;
        _contactRepository = contactRepository;
        _servicePlanRepository = servicePlanRepository;
    }

    public async Task<RequestTrackingResultDto?> LookupAsync(RequestTrackingLookupDto dto)
    {
        var code = ReferenceCodeGenerator.Normalize(dto.ReferenceCode);
        var email = dto.Email.Trim().ToLowerInvariant();

        if (code.StartsWith("ORD-", StringComparison.OrdinalIgnoreCase))
            return await LookupOrderAsync(code, email);

        if (code.StartsWith("AFF-", StringComparison.OrdinalIgnoreCase))
            return await LookupAffiliateAsync(code, email);

        if (code.StartsWith("CON-", StringComparison.OrdinalIgnoreCase))
            return await LookupContactAsync(code, email);

        return null;
    }

    private async Task<RequestTrackingResultDto?> LookupOrderAsync(string code, string email)
    {
        var orders = await _orderRepository.GetAllAsync();
        var order = orders.FirstOrDefault(item =>
            EmailMatches(item.Email, email) &&
            string.Equals(
                ReferenceCodeGenerator.GetDisplayCode("ORD", item.ReferenceCode, item.CreatedAt, item.Id),
                code,
                StringComparison.OrdinalIgnoreCase));

        if (order == null)
            return null;

        var plan = await _servicePlanRepository.GetByIdAsync(order.ServicePlanId);
        return new RequestTrackingResultDto
        {
            ReferenceCode = ReferenceCodeGenerator.GetDisplayCode("ORD", order.ReferenceCode, order.CreatedAt, order.Id),
            RequestType = "Order",
            Status = order.Status.ToString(),
            Title = plan?.Name ?? "Yêu cầu dịch vụ NovaCloud",
            Subtitle = order.BillingCycle.Equals("Yearly", StringComparison.OrdinalIgnoreCase)
                ? "Chu kỳ thanh toán: Theo năm"
                : "Chu kỳ thanh toán: Theo tháng",
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt
        };
    }

    private async Task<RequestTrackingResultDto?> LookupAffiliateAsync(string code, string email)
    {
        var applications = await _affiliateRepository.GetAllAsync();
        var application = applications.FirstOrDefault(item =>
            EmailMatches(item.Email, email) &&
            string.Equals(
                ReferenceCodeGenerator.GetDisplayCode("AFF", item.ReferenceCode, item.CreatedAt, item.Id),
                code,
                StringComparison.OrdinalIgnoreCase));

        if (application == null)
            return null;

        return new RequestTrackingResultDto
        {
            ReferenceCode = ReferenceCodeGenerator.GetDisplayCode("AFF", application.ReferenceCode, application.CreatedAt, application.Id),
            RequestType = "Affiliate",
            Status = application.Status,
            Title = "Hồ sơ đăng ký đối tác NovaCloud",
            Subtitle = string.IsNullOrWhiteSpace(application.CompanyName)
                ? "Chương trình Affiliate"
                : application.CompanyName,
            CreatedAt = application.CreatedAt,
            UpdatedAt = application.UpdatedAt
        };
    }

    private async Task<RequestTrackingResultDto?> LookupContactAsync(string code, string email)
    {
        var contacts = await _contactRepository.GetAllAsync();
        var contact = contacts.FirstOrDefault(item =>
            EmailMatches(item.Email, email) &&
            string.Equals(
                ReferenceCodeGenerator.GetDisplayCode("CON", item.ReferenceCode, item.CreatedAt, item.Id),
                code,
                StringComparison.OrdinalIgnoreCase));

        if (contact == null)
            return null;

        return new RequestTrackingResultDto
        {
            ReferenceCode = ReferenceCodeGenerator.GetDisplayCode("CON", contact.ReferenceCode, contact.CreatedAt, contact.Id),
            RequestType = "Contact",
            Status = contact.Status,
            Title = contact.Subject,
            Subtitle = "Yêu cầu liên hệ với NovaCloud",
            CreatedAt = contact.CreatedAt,
            UpdatedAt = contact.UpdatedAt
        };
    }

    private static bool EmailMatches(string storedEmail, string requestedEmail) =>
        string.Equals(storedEmail.Trim(), requestedEmail, StringComparison.OrdinalIgnoreCase);
}
