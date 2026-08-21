using CloudService.Application.DTOs.AffiliateApplications;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.WebApi.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AffiliateApplicationsController : ControllerBase
{
    private readonly IAffiliateApplicationService _service;
    private readonly IAuditLogService _auditLogService;

    public AffiliateApplicationsController(
        IAffiliateApplicationService service,
        IAuditLogService auditLogService)
    {
        _service = service;
        _auditLogService = auditLogService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create(CreateAffiliateApplicationDto dto)
    {
        var application = await _service.CreateAsync(dto);

        await _auditLogService.LogGuestAsync(
            application.FullName,
            "CREATE",
            "AffiliateApplication",
            application.Id,
            application.ReferenceCode,
            "Khách gửi hồ sơ đăng ký Affiliate.",
            newValue: application.Status);

        return StatusCode(StatusCodes.Status201Created, application);
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
        var application = await _service.GetByIdAsync(id);
        if (application == null)
            return Problem(statusCode: 404, title: "Resource Not Found", detail: "Không tìm thấy hồ sơ Affiliate.");

        return Ok(application);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateAffiliateStatusDto dto)
    {
        var before = await _service.GetByIdAsync(id);
        var application = await _service.UpdateStatusAsync(id, dto);

        if (application == null)
            return Problem(statusCode: 404, title: "Resource Not Found", detail: "Không tìm thấy hồ sơ Affiliate.");

        if (before != null &&
            !string.Equals(before.Status, application.Status, StringComparison.OrdinalIgnoreCase))
        {
            await _auditLogService.LogFromUserAsync(
                User,
                "UPDATE_STATUS",
                "AffiliateApplication",
                application.Id,
                application.ReferenceCode,
                $"Cập nhật trạng thái hồ sơ Affiliate của {application.FullName}.",
                before.Status,
                application.Status);
        }

        return Ok(application);
    }
}
