namespace CloudService.Application.DTOs.Dashboard;

public class DashboardSummaryDto
{
    public int TotalServicePlans { get; set; }

    public int ActiveServicePlans { get; set; }

    public int TotalUsers { get; set; }

    public int ActiveUsers { get; set; }

    public int TotalOrders { get; set; }

    public int NewOrders { get; set; }

    public int ProcessingOrders { get; set; }

    public int CompletedOrders { get; set; }

    public int RejectedOrders { get; set; }

    public int TotalAffiliates { get; set; }

    public int NewAffiliates { get; set; }

    public int ProcessingAffiliates { get; set; }

    public int CompletedAffiliates { get; set; }

    public int RejectedAffiliates { get; set; }

    public int TotalContacts { get; set; }

    public int NewContacts { get; set; }

    public int ProcessingContacts { get; set; }

    public int ResolvedContacts { get; set; }

    public int TotalNews { get; set; }

    public int PublishedNews { get; set; }

    public int DraftNews { get; set; }

    public int PendingWork { get; set; }

    public IReadOnlyCollection<DashboardRecentItemDto> RecentItems { get; set; }
        = Array.Empty<DashboardRecentItemDto>();
}
