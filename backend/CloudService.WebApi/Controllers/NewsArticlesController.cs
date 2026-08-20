using CloudService.Application.DTOs.NewsArticles;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsArticlesController : ControllerBase
{
    private readonly INewsArticleService _service;

    public NewsArticlesController(INewsArticleService service)
    {
        _service = service;
    }

    // Public: chỉ trả các bài đã publish.
    // GET: api/NewsArticles?search=cloud&category=Huong-dan&sort=latest&page=1&pageSize=6
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublished(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 6)
    {
        var result = await _service.GetPublishedAsync(
            search,
            category,
            sort,
            page,
            pageSize);

        return Ok(result);
    }

    // Public: chi tiết bài đã publish theo Guid.
    // GET: api/NewsArticles/{id}
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublishedById(Guid id)
    {
        var article = await _service.GetPublishedByIdAsync(id);

        if (article == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy bài viết.");
        }

        return Ok(article);
    }

    // Public: frontend dùng slug để tạo URL đọc bài thân thiện.
    // GET: api/NewsArticles/slug/huong-dan-cloud-vps
    [HttpGet("slug/{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublishedBySlug(string slug)
    {
        var article = await _service.GetPublishedBySlugAsync(slug);

        if (article == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy bài viết.");
        }

        return Ok(article);
    }

    // Public: danh sách category dùng cho bộ lọc News frontend.
    // GET: api/NewsArticles/categories
    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _service.GetPublishedCategoriesAsync();
        return Ok(categories);
    }

    // Admin/Editor: xem cả bài nháp và bài đã publish.
    // GET: api/NewsArticles/manage?isPublished=false&page=1&pageSize=10
    [HttpGet("manage")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> GetForManagement(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] bool? isPublished,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _service.GetForManagementAsync(
            search,
            category,
            isPublished,
            sort,
            page,
            pageSize);

        return Ok(result);
    }

    // Admin/Editor: lấy một bài kể cả khi đang Draft.
    // GET: api/NewsArticles/manage/{id}
    [HttpGet("manage/{id:guid}")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> GetByIdForManagement(Guid id)
    {
        var article = await _service.GetByIdForManagementAsync(id);

        if (article == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy bài viết.");
        }

        return Ok(article);
    }

    // POST: api/NewsArticles
    [HttpPost]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> Create(CreateNewsArticleDto dto)
    {
        var article = await _service.CreateAsync(dto);
        return StatusCode(StatusCodes.Status201Created, article);
    }

    // PUT: api/NewsArticles/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateNewsArticleDto dto)
    {
        var success = await _service.UpdateAsync(id, dto);

        if (!success)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy bài viết.");
        }

        return NoContent();
    }

    // DELETE: api/NewsArticles/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _service.DeleteAsync(id);

        if (!success)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy bài viết.");
        }

        return NoContent();
    }
}
