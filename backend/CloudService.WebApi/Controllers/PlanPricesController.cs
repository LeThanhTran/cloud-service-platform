using CloudService.Application.DTOs.PlanPrices;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanPricesController : ControllerBase
{
    private readonly IPlanPriceService _service;

    public PlanPricesController(IPlanPriceService service)
    {
        _service = service;
    }

    // GET: api/PlanPrices
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    // GET: api/PlanPrices/{id}
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    // GET: api/PlanPrices/by-plan/{servicePlanId}
    [HttpGet("by-plan/{servicePlanId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByServicePlanId(Guid servicePlanId)
    {
        var result = await _service.GetByServicePlanIdAsync(servicePlanId);
        return Ok(result);
    }

    // POST: api/PlanPrices
    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePlanPriceDto dto)
    {
        var result = await _service.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result);
    }

    // PUT: api/PlanPrices/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdatePlanPriceDto dto)
    {
        var success = await _service.UpdateAsync(id, dto);

        if (!success)
            return NotFound();

        return NoContent();
    }

    // DELETE: api/PlanPrices/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _service.DeleteAsync(id);

        if (!success)
            return NotFound();

        return NoContent();
    }
}