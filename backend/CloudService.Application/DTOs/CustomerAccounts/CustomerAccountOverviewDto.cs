namespace CloudService.Application.DTOs.CustomerAccounts;

public class CustomerAccountOverviewDto
{
    public CustomerProfileDto Profile { get; set; } = new();
    public int TotalRequests { get; set; }
    public int ActiveRequests { get; set; }
    public int CompletedRequests { get; set; }
    public int UnreadNotifications { get; set; }
    public IReadOnlyCollection<CustomerRequestItemDto> RecentRequests { get; set; }
        = Array.Empty<CustomerRequestItemDto>();
}
