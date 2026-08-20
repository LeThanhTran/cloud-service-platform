using CloudService.Application.DTOs.Dashboard;

namespace CloudService.Application.Interfaces.Services;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync();
}
