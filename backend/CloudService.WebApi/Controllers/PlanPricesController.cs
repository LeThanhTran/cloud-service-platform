using CloudService.Application.DTOs.PlanPrices;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.WebApi.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanPricesController : ControllerBase
{
    private readonly IPlanPriceService _service;
    private readonly IAuditLogService _auditLogService;

    public PlanPricesController(
        IPlanPriceService service,
        IAuditLogService auditLogService)
    {
        _service = service;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("by-plan/{servicePlanId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByServicePlanId(Guid servicePlanId)
    {
        var result = await _service.GetByServicePlanIdAsync(servicePlanId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePlanPriceDto dto)
    {
        var result = await _service.CreateAsync(dto);

        await _auditLogService.LogFromUserAsync(
            User,
            "CREATE",
            "PlanPrice",
            result.Id,
            $"{result.BillingCycle} - {result.Price:N0}",
            "Tạo bảng giá cho gói dịch vụ.",
            newValue: $"Cycle={result.BillingCycle}; Price={result.Price}; Active={result.IsActive}");

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdatePlanPriceDto dto)
    {
        var before = await _service.GetByIdAsync(id);
        var success = await _service.UpdateAsync(id, dto);

        if (!success)
            return NotFound();

        var after = await _service.GetByIdAsync(id);

        await _auditLogService.LogFromUserAsync(
            User,
            "UPDATE",
            "PlanPrice",
            id,
            after == null ? null : $"{after.BillingCycle} - {after.Price:N0}",
            "Cập nhật bảng giá dịch vụ.",
            before == null ? null : $"Cycle={before.BillingCycle}; Price={before.Price}; Active={before.IsActive}",
            after == null ? null : $"Cycle={after.BillingCycle}; Price={after.Price}; Active={after.IsActive}");

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var before = await _service.GetByIdAsync(id);
        var success = await _service.DeleteAsync(id);

        if (!success)
            return NotFound();

        await _auditLogService.LogFromUserAsync(
            User,
            "DELETE",
            "PlanPrice",
            id,
            before == null ? null : $"{before.BillingCycle} - {before.Price:N0}",
            "Xóa bảng giá dịch vụ.",
            oldValue: before == null ? null : $"Cycle={before.BillingCycle}; Price={before.Price}; Active={before.IsActive}");

        return NoContent();
    }
}
