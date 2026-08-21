using CloudService.Application.DTOs.ServiceCategories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.WebApi.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceCategoriesController : ControllerBase
{
    private readonly IServiceCategoryService _serviceCategoryService;
    private readonly IAuditLogService _auditLogService;

    public ServiceCategoriesController(
        IServiceCategoryService serviceCategoryService,
        IAuditLogService auditLogService)
    {
        _serviceCategoryService = serviceCategoryService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ServiceCategoryDto>>> GetAll()
    {
        var categories = await _serviceCategoryService.GetAllAsync();
        return Ok(categories);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ServiceCategoryDto>> GetById(Guid id)
    {
        var category = await _serviceCategoryService.GetByIdAsync(id);

        if (category == null)
            return NotFound();

        return Ok(category);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ServiceCategoryDto>> Create(
        CreateServiceCategoryDto dto)
    {
        var category = await _serviceCategoryService.CreateAsync(dto);

        await _auditLogService.LogFromUserAsync(
            User,
            "CREATE",
            "ServiceCategory",
            category.Id,
            category.Name,
            $"Tạo danh mục dịch vụ {category.Name}.",
            newValue: $"Slug={category.Slug}; Active={category.IsActive}");

        return CreatedAtAction(
            nameof(GetById),
            new { id = category.Id },
            category);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ServiceCategoryDto>> Update(
        Guid id,
        UpdateServiceCategoryDto dto)
    {
        var before = await _serviceCategoryService.GetByIdAsync(id);
        var category = await _serviceCategoryService.UpdateAsync(id, dto);

        if (category == null)
            return NotFound();

        await _auditLogService.LogFromUserAsync(
            User,
            "UPDATE",
            "ServiceCategory",
            category.Id,
            category.Name,
            $"Cập nhật danh mục dịch vụ {category.Name}.",
            before == null ? null : $"Name={before.Name}; Slug={before.Slug}; Active={before.IsActive}",
            $"Name={category.Name}; Slug={category.Slug}; Active={category.IsActive}");

        return Ok(category);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var before = await _serviceCategoryService.GetByIdAsync(id);
        var deleted = await _serviceCategoryService.DeleteAsync(id);

        if (!deleted)
            return NotFound();

        await _auditLogService.LogFromUserAsync(
            User,
            "DELETE",
            "ServiceCategory",
            id,
            before?.Name,
            $"Xóa danh mục dịch vụ {before?.Name ?? id.ToString()}.",
            oldValue: before == null ? null : $"Slug={before.Slug}; Active={before.IsActive}");

        return NoContent();
    }
}
