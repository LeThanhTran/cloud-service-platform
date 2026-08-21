using CloudService.Application.DTOs.OrderRequests;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.WebApi.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrderRequestsController : ControllerBase
{
    private readonly IOrderRequestService _service;
    private readonly IOrderExcelExportService _excelExportService;
    private readonly IAuditLogService _auditLogService;

    public OrderRequestsController(
        IOrderRequestService service,
        IOrderExcelExportService excelExportService,
        IAuditLogService auditLogService)
    {
        _service = service;
        _excelExportService = excelExportService;
        _auditLogService = auditLogService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create(CreateOrderRequestDto dto)
    {
        var order = await _service.CreateAsync(dto);

        await _auditLogService.LogGuestAsync(
            order.CustomerName,
            "CREATE",
            "OrderRequest",
            order.Id,
            order.ReferenceCode,
            $"Khách gửi yêu cầu đăng ký {order.ServicePlanName} ({order.BillingCycle}).",
            newValue: order.Status);

        return StatusCode(StatusCodes.Status201Created, order);
    }

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

    [HttpGet("export")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> Export(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? sort)
    {
        var content = await _excelExportService.ExportAsync(search, status, sort);
        var fileName = $"NovaCloud_Orders_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";

        await _auditLogService.LogFromUserAsync(
            User,
            "EXPORT",
            "OrderRequest",
            description: $"Xuất danh sách yêu cầu dịch vụ ra Excel. Search={search ?? "(trống)"}, Status={status ?? "Tất cả"}, Sort={sort ?? "latest"}.");

        return File(
            content,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
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
        var before = await _service.GetByIdAsync(id);
        var order = await _service.UpdateStatusAsync(id, dto);

        if (order == null)
            return Problem(statusCode: 404, title: "Resource Not Found", detail: "Không tìm thấy đơn hàng.");

        if (before != null &&
            !string.Equals(before.Status, order.Status, StringComparison.OrdinalIgnoreCase))
        {
            await _auditLogService.LogFromUserAsync(
                User,
                "UPDATE_STATUS",
                "OrderRequest",
                order.Id,
                order.ReferenceCode,
                $"Cập nhật trạng thái yêu cầu dịch vụ của {order.CustomerName}.",
                before.Status,
                order.Status);
        }

        return Ok(order);
    }
}
