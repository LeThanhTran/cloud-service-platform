using CloudService.Application.DTOs.AffiliateApplications;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AffiliateApplicationsController : ControllerBase
{
    private readonly IAffiliateApplicationService _service;

    public AffiliateApplicationsController(IAffiliateApplicationService service)
    {
        _service = service;
    }

    // Public: gửi hồ sơ đăng ký đối tác/Affiliate.
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create(CreateAffiliateApplicationDto dto)
    {
        var application = await _service.CreateAsync(dto);
        return StatusCode(StatusCodes.Status201Created, application);
    }

    // Admin/Editor: xem và xử lý hồ sơ Affiliate.
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
        var application = await _service.UpdateStatusAsync(id, dto);
        if (application == null)
            return Problem(statusCode: 404, title: "Resource Not Found", detail: "Không tìm thấy hồ sơ Affiliate.");

        return Ok(application);
    }
}
