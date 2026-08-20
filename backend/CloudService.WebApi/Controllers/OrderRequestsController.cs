using CloudService.Application.DTOs.OrderRequests;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrderRequestsController : ControllerBase
{
    private readonly IOrderRequestService _service;

    public OrderRequestsController(IOrderRequestService service)
    {
        _service = service;
    }

    // Public: khách hàng gửi yêu cầu đăng ký dịch vụ.
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create(CreateOrderRequestDto dto)
    {
        var order = await _service.CreateAsync(dto);
        return StatusCode(StatusCodes.Status201Created, order);
    }

    // Admin/Editor: danh sách đơn hàng, hỗ trợ tìm kiếm/lọc/phân trang.
    [HttpGet("manage")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> GetForManagement(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _service.GetForManagementAsync(search, status, sort, page, pageSize);
        return Ok(result);
    }

    [HttpGet("manage/{id:guid}")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var order = await _service.GetByIdAsync(id);
        if (order == null)
            return Problem(statusCode: 404, title: "Resource Not Found", detail: "Không tìm thấy đơn hàng.");

        return Ok(order);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateOrderStatusDto dto)
    {
        var order = await _service.UpdateStatusAsync(id, dto);
        if (order == null)
            return Problem(statusCode: 404, title: "Resource Not Found", detail: "Không tìm thấy đơn hàng.");

        return Ok(order);
    }
}
