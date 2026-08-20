using CloudService.Application.DTOs.AffiliateApplications;
using CloudService.Application.DTOs.Common;

namespace CloudService.Application.Interfaces.Services;

public interface IAffiliateApplicationService
{
    Task<AffiliateApplicationDto> CreateAsync(CreateAffiliateApplicationDto dto);
    Task<PagedResultDto<AffiliateApplicationDto>> GetForManagementAsync(
        string? search,
        string? status,
        string? sort,
        int page,
        int pageSize);
    Task<AffiliateApplicationDto?> GetByIdAsync(Guid id);
    Task<AffiliateApplicationDto?> UpdateStatusAsync(Guid id, UpdateAffiliateStatusDto dto);
}
