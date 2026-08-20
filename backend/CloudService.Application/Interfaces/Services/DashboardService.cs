using CloudService.Application.DTOs.Dashboard;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Interfaces.Services;

public class DashboardService : IDashboardService
{
    private readonly IRepository<ServicePlan> _servicePlanRepository;
    private readonly IRepository<AppUser> _userRepository;
    private readonly IRepository<OrderRequest> _orderRepository;
    private readonly IRepository<AffiliateApplication> _affiliateRepository;
    private readonly IRepository<ContactRequest> _contactRepository;
    private readonly IRepository<NewsArticle> _newsRepository;

    public DashboardService(
        IRepository<ServicePlan> servicePlanRepository,
        IRepository<AppUser> userRepository,
        IRepository<OrderRequest> orderRepository,
        IRepository<AffiliateApplication> affiliateRepository,
        IRepository<ContactRequest> contactRepository,
        IRepository<NewsArticle> newsRepository)
    {
        _servicePlanRepository = servicePlanRepository;
        _userRepository = userRepository;
        _orderRepository = orderRepository;
        _affiliateRepository = affiliateRepository;
        _contactRepository = contactRepository;
        _newsRepository = newsRepository;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync()
    {
        // Các repository dùng chung một scoped DbContext. EF Core không cho phép
        // nhiều truy vấn bất đồng bộ chạy đồng thời trên cùng DbContext, vì vậy
        // dashboard tải tuần tự từng nhóm dữ liệu để tránh lỗi concurrency.
        var plans = (await _servicePlanRepository.GetAllAsync()).ToList();
        var users = (await _userRepository.GetAllAsync()).ToList();
        var orders = (await _orderRepository.GetAllAsync()).ToList();
        var affiliates = (await _affiliateRepository.GetAllAsync()).ToList();
        var contacts = (await _contactRepository.GetAllAsync()).ToList();
        var news = (await _newsRepository.GetAllAsync()).ToList();

        var planNames = plans.ToDictionary(plan => plan.Id, plan => plan.Name);

        var newOrders = orders.Count(order => order.Status == OrderStatus.New);
        var processingOrders = orders.Count(order => order.Status == OrderStatus.Processing);
        var completedOrders = orders.Count(order => order.Status == OrderStatus.Completed);
        var rejectedOrders = orders.Count(order => order.Status == OrderStatus.Rejected);

        var newAffiliates = affiliates.Count(application => IsStatus(application.Status, "New"));
        var processingAffiliates = affiliates.Count(application => IsStatus(application.Status, "Processing"));
        var completedAffiliates = affiliates.Count(application => IsStatus(application.Status, "Completed"));
        var rejectedAffiliates = affiliates.Count(application => IsStatus(application.Status, "Rejected"));

        var newContacts = contacts.Count(request => IsStatus(request.Status, "New"));
        var processingContacts = contacts.Count(request => IsStatus(request.Status, "Processing"));
        var resolvedContacts = contacts.Count(request => IsStatus(request.Status, "Resolved"));

        var recentItems = BuildRecentItems(orders, affiliates, contacts, news, planNames);

        return new DashboardSummaryDto
        {
            TotalServicePlans = plans.Count,
            ActiveServicePlans = plans.Count(plan => plan.IsActive),
            TotalUsers = users.Count,
            ActiveUsers = users.Count(user => user.IsActive),

            TotalOrders = orders.Count,
            NewOrders = newOrders,
            ProcessingOrders = processingOrders,
            CompletedOrders = completedOrders,
            RejectedOrders = rejectedOrders,

            TotalAffiliates = affiliates.Count,
            NewAffiliates = newAffiliates,
            ProcessingAffiliates = processingAffiliates,
            CompletedAffiliates = completedAffiliates,
            RejectedAffiliates = rejectedAffiliates,

            TotalContacts = contacts.Count,
            NewContacts = newContacts,
            ProcessingContacts = processingContacts,
            ResolvedContacts = resolvedContacts,

            TotalNews = news.Count,
            PublishedNews = news.Count(article => article.IsPublished),
            DraftNews = news.Count(article => !article.IsPublished),

            PendingWork = newOrders + processingOrders
                + newAffiliates + processingAffiliates
                + newContacts + processingContacts,

            RecentItems = recentItems
        };
    }

    private static IReadOnlyCollection<DashboardRecentItemDto> BuildRecentItems(
        IEnumerable<OrderRequest> orders,
        IEnumerable<AffiliateApplication> affiliates,
        IEnumerable<ContactRequest> contacts,
        IEnumerable<NewsArticle> news,
        IReadOnlyDictionary<Guid, string> planNames)
    {
        var orderItems = orders.Select(order => new DashboardRecentItemDto
        {
            Type = "Order",
            Title = order.CustomerName,
            Subtitle = planNames.TryGetValue(order.ServicePlanId, out var planName)
                ? $"Đăng ký {planName}"
                : "Yêu cầu dịch vụ",
            Status = order.Status.ToString(),
            Link = "/admin/orders",
            CreatedAt = order.CreatedAt
        });

        var affiliateItems = affiliates.Select(application => new DashboardRecentItemDto
        {
            Type = "Affiliate",
            Title = application.FullName,
            Subtitle = string.IsNullOrWhiteSpace(application.CompanyName)
                ? "Hồ sơ Affiliate"
                : application.CompanyName,
            Status = application.Status,
            Link = "/admin/affiliates",
            CreatedAt = application.CreatedAt
        });

        var contactItems = contacts.Select(request => new DashboardRecentItemDto
        {
            Type = "Contact",
            Title = request.FullName,
            Subtitle = request.Subject,
            Status = request.Status,
            Link = "/admin/contacts",
            CreatedAt = request.CreatedAt
        });

        var newsItems = news.Select(article => new DashboardRecentItemDto
        {
            Type = "News",
            Title = article.Title,
            Subtitle = article.Category,
            Status = article.IsPublished ? "Published" : "Draft",
            Link = "/admin/news",
            CreatedAt = article.CreatedAt
        });

        return orderItems
            .Concat(affiliateItems)
            .Concat(contactItems)
            .Concat(newsItems)
            .OrderByDescending(item => item.CreatedAt)
            .Take(8)
            .ToArray();
    }

    private static bool IsStatus(string status, string expected) =>
        string.Equals(status, expected, StringComparison.OrdinalIgnoreCase);
}
