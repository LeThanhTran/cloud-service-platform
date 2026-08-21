using CloudService.Application.DTOs.ContactRequests;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.WebApi.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactRequestsController : ControllerBase
{
    private readonly IContactRequestService _service;
    private readonly IAuditLogService _auditLogService;

    public ContactRequestsController(
        IContactRequestService service,
        IAuditLogService auditLogService)
    {
        _service = service;
        _auditLogService = auditLogService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create(CreateContactRequestDto dto)
    {
        var request = await _service.CreateAsync(dto);

        await _auditLogService.LogGuestAsync(
            request.FullName,
            "CREATE",
            "ContactRequest",
            request.Id,
            request.ReferenceCode,
            $"Khách gửi liên hệ với chủ đề \"{request.Subject}\".",
            newValue: request.Status);

        return StatusCode(StatusCodes.Status201Created, request);
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

    [HttpGet("manage/{id:guid}")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var request = await _service.GetByIdAsync(id);

        if (request == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy yêu cầu liên hệ.");
        }

        return Ok(request);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateContactStatusDto dto)
    {
        var before = await _service.GetByIdAsync(id);
        var request = await _service.UpdateStatusAsync(id, dto);

        if (request == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy yêu cầu liên hệ.");
        }

        if (before != null &&
            !string.Equals(before.Status, request.Status, StringComparison.OrdinalIgnoreCase))
        {
            await _auditLogService.LogFromUserAsync(
                User,
                "UPDATE_STATUS",
                "ContactRequest",
                request.Id,
                request.ReferenceCode,
                $"Xử lý liên hệ \"{request.Subject}\" của {request.FullName}.",
                before.Status,
                request.Status);
        }

        return Ok(request);
    }
}
