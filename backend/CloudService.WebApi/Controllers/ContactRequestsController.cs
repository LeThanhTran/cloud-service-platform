using CloudService.Application.DTOs.ContactRequests;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactRequestsController : ControllerBase
{
    private readonly IContactRequestService _service;

    public ContactRequestsController(IContactRequestService service)
    {
        _service = service;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create(CreateContactRequestDto dto)
    {
        var request = await _service.CreateAsync(dto);
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
        var request = await _service.UpdateStatusAsync(id, dto);

        if (request == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy yêu cầu liên hệ.");
        }

        return Ok(request);
    }
}
