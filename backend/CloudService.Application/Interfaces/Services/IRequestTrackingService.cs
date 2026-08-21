using CloudService.Application.DTOs.RequestTracking;

namespace CloudService.Application.Interfaces.Services;

public interface IRequestTrackingService
{
    Task<RequestTrackingResultDto?> LookupAsync(RequestTrackingLookupDto dto);
}
