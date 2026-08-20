using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.ContactRequests;

namespace CloudService.Application.Interfaces.Services;

public interface IContactRequestService
{
    Task<ContactRequestDto> CreateAsync(CreateContactRequestDto dto);

    Task<PagedResultDto<ContactRequestDto>> GetForManagementAsync(
        string? search,
        string? status,
        string? sort,
        int page,
        int pageSize);

    Task<ContactRequestDto?> GetByIdAsync(Guid id);

    Task<ContactRequestDto?> UpdateStatusAsync(Guid id, UpdateContactStatusDto dto);
}
