using CloudService.Application.DTOs.ServiceCategories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceCategoriesController : ControllerBase
{
    private readonly IServiceCategoryService _serviceCategoryService;

    public ServiceCategoriesController(
        IServiceCategoryService serviceCategoryService)
    {
        _serviceCategoryService = serviceCategoryService;
    }

    // GET: api/ServiceCategories
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ServiceCategoryDto>>> GetAll()
    {
        var categories = await _serviceCategoryService.GetAllAsync();

        return Ok(categories);
    }

    // GET: api/ServiceCategories/{id}
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ServiceCategoryDto>> GetById(Guid id)
    {
        var category = await _serviceCategoryService.GetByIdAsync(id);

        if (category == null)
            return NotFound();

        return Ok(category);
    }

    // POST: api/ServiceCategories
    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ServiceCategoryDto>> Create(
        CreateServiceCategoryDto dto)
    {
        var category = await _serviceCategoryService.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = category.Id },
            category);
    }

    // PUT: api/ServiceCategories/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ServiceCategoryDto>> Update(
        Guid id,
        UpdateServiceCategoryDto dto)
    {
        var category =
            await _serviceCategoryService.UpdateAsync(id, dto);

        if (category == null)
            return NotFound();

        return Ok(category);
    }

    // DELETE: api/ServiceCategories/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _serviceCategoryService.DeleteAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }
}