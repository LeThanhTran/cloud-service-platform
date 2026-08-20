using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.OrderRequests;

namespace CloudService.Application.Interfaces.Services;

public interface IOrderRequestService
{
    Task<OrderRequestDto> CreateAsync(CreateOrderRequestDto dto);
    Task<PagedResultDto<OrderRequestDto>> GetForManagementAsync(
        string? search,
        string? status,
        string? sort,
        int page,
        int pageSize);
    Task<OrderRequestDto?> GetByIdAsync(Guid id);
    Task<OrderRequestDto?> UpdateStatusAsync(Guid id, UpdateOrderStatusDto dto);
}
