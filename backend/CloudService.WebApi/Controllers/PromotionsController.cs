using CloudService.Application.DTOs.Promotions;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.WebApi.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PromotionsController : ControllerBase
{
    private readonly IPromotionService _service;
    private readonly IAuditLogService _auditLogService;

    public PromotionsController(
        IPromotionService service,
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
        [FromBody] CreatePromotionDto dto)
    {
        var result = await _service.CreateAsync(dto);

        await _auditLogService.LogFromUserAsync(
            User,
            "CREATE",
            "Promotion",
            result.Id,
            result.Name,
            $"Tạo khuyến mãi {result.Name}.",
            newValue: $"Discount={result.DiscountPercent}%; Active={result.IsActive}");

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdatePromotionDto dto)
    {
        var before = await _service.GetByIdAsync(id);
        var success = await _service.UpdateAsync(id, dto);

        if (!success)
            return NotFound();

        var after = await _service.GetByIdAsync(id);

        await _auditLogService.LogFromUserAsync(
            User,
            "UPDATE",
            "Promotion",
            id,
            after?.Name ?? before?.Name,
            $"Cập nhật khuyến mãi {after?.Name ?? before?.Name ?? id.ToString()}.",
            before == null ? null : $"Discount={before.DiscountPercent}%; Active={before.IsActive}",
            after == null ? null : $"Discount={after.DiscountPercent}%; Active={after.IsActive}");

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
            "Promotion",
            id,
            before?.Name,
            $"Xóa khuyến mãi {before?.Name ?? id.ToString()}.",
            oldValue: before == null ? null : $"Discount={before.DiscountPercent}%; Active={before.IsActive}");

        return NoContent();
    }
}
