using CloudService.Application.DTOs.CustomerAccounts;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Utilities;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class CustomerAccountService : ICustomerAccountService
{
    private readonly IRepository<AppUser> _userRepository;
    private readonly IRepository<OrderRequest> _orderRepository;
    private readonly IRepository<ContactRequest> _contactRepository;
    private readonly IRepository<AffiliateApplication> _affiliateRepository;
    private readonly IRepository<ServicePlan> _servicePlanRepository;
    private readonly INotificationService _notificationService;

    public CustomerAccountService(
        IRepository<AppUser> userRepository,
        IRepository<OrderRequest> orderRepository,
        IRepository<ContactRequest> contactRepository,
        IRepository<AffiliateApplication> affiliateRepository,
        IRepository<ServicePlan> servicePlanRepository,
        INotificationService notificationService)
    {
        _userRepository = userRepository;
        _orderRepository = orderRepository;
        _contactRepository = contactRepository;
        _affiliateRepository = affiliateRepository;
        _servicePlanRepository = servicePlanRepository;
        _notificationService = notificationService;
    }

    public async Task<CustomerAccountOverviewDto> GetOverviewAsync(Guid userId)
    {
        var user = await GetCustomerAsync(userId);
        var requests = await GetRequestsForEmailAsync(user.Email);
        var unreadNotifications = await _notificationService.GetUnreadCountAsync(user.Id);

        return new CustomerAccountOverviewDto
        {
            Profile = new CustomerProfileDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = AsUtc(user.CreatedAt)
            },
            TotalRequests = requests.Count,
            ActiveRequests = requests.Count(request =>
                request.Status.Equals("New", StringComparison.OrdinalIgnoreCase) ||
                request.Status.Equals("Processing", StringComparison.OrdinalIgnoreCase)),
            CompletedRequests = requests.Count(request =>
                request.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
                request.Status.Equals("Resolved", StringComparison.OrdinalIgnoreCase)),
            UnreadNotifications = unreadNotifications,
            RecentRequests = requests.Take(5).ToArray()
        };
    }

    public async Task<IReadOnlyCollection<CustomerRequestItemDto>> GetRequestsAsync(Guid userId)
    {
        var user = await GetCustomerAsync(userId);
        return await GetRequestsForEmailAsync(user.Email);
    }

    private async Task<AppUser> GetCustomerAsync(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại.");

        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Tài khoản đã bị vô hiệu hóa.");

        if (!string.Equals(user.Role, AppRoles.User, StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("Khu vực tài khoản khách hàng chỉ dành cho role User.");

        return user;
    }

    private async Task<IReadOnlyCollection<CustomerRequestItemDto>> GetRequestsForEmailAsync(string email)
    {
        var normalizedEmail = email.Trim();

        // Các repository dùng chung scoped DbContext, nên tải tuần tự để tránh
        // chạy nhiều truy vấn EF Core đồng thời trên cùng một DbContext.
        var orders = (await _orderRepository.GetAllAsync())
            .Where(order => SameEmail(order.Email, normalizedEmail))
            .ToArray();

        var contacts = (await _contactRepository.GetAllAsync())
            .Where(contact => SameEmail(contact.Email, normalizedEmail))
            .ToArray();

        var affiliates = (await _affiliateRepository.GetAllAsync())
            .Where(application => SameEmail(application.Email, normalizedEmail))
            .ToArray();

        var servicePlans = (await _servicePlanRepository.GetAllAsync())
            .ToDictionary(plan => plan.Id, plan => plan.Name);

        var result = new List<CustomerRequestItemDto>(
            orders.Length + contacts.Length + affiliates.Length);

        result.AddRange(orders.Select(order => new CustomerRequestItemDto
        {
            Id = order.Id,
            ReferenceCode = ReferenceCodeGenerator.GetDisplayCode(
                "ORD", order.ReferenceCode, order.CreatedAt, order.Id),
            RequestType = "Order",
            Title = servicePlans.GetValueOrDefault(order.ServicePlanId, "Gói dịch vụ"),
            Subtitle = $"Chu kỳ: {order.BillingCycle}",
            Status = order.Status.ToString(),
            CreatedAt = AsUtc(order.CreatedAt),
            UpdatedAt = AsNullableUtc(order.UpdatedAt)
        }));

        result.AddRange(contacts.Select(contact => new CustomerRequestItemDto
        {
            Id = contact.Id,
            ReferenceCode = ReferenceCodeGenerator.GetDisplayCode(
                "CON", contact.ReferenceCode, contact.CreatedAt, contact.Id),
            RequestType = "Contact",
            Title = contact.Subject,
            Subtitle = "Yêu cầu liên hệ",
            Status = contact.Status,
            CreatedAt = AsUtc(contact.CreatedAt),
            UpdatedAt = AsNullableUtc(contact.UpdatedAt)
        }));

        result.AddRange(affiliates.Select(application => new CustomerRequestItemDto
        {
            Id = application.Id,
            ReferenceCode = ReferenceCodeGenerator.GetDisplayCode(
                "AFF", application.ReferenceCode, application.CreatedAt, application.Id),
            RequestType = "Affiliate",
            Title = "Hồ sơ Affiliate",
            Subtitle = !string.IsNullOrWhiteSpace(application.CompanyName)
                ? application.CompanyName
                : application.Website,
            Status = application.Status,
            CreatedAt = AsUtc(application.CreatedAt),
            UpdatedAt = AsNullableUtc(application.UpdatedAt)
        }));

        return result
            .OrderByDescending(request => request.CreatedAt)
            .ToArray();
    }

    private static bool SameEmail(string candidate, string expected) =>
        string.Equals(candidate.Trim(), expected, StringComparison.OrdinalIgnoreCase);

    private static DateTime AsUtc(DateTime value) =>
        DateTime.SpecifyKind(value, DateTimeKind.Utc);

    private static DateTime? AsNullableUtc(DateTime? value) =>
        value.HasValue ? AsUtc(value.Value) : null;
}
