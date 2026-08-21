using CloudService.Application.DTOs.NewsArticles;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.WebApi.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsArticlesController : ControllerBase
{
    private const long MaxImageSize = 5 * 1024 * 1024;
    private const long MaxUploadRequestSize = 6 * 1024 * 1024;

    private static readonly IReadOnlyDictionary<string, string> AllowedImageTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["image/jpeg"] = ".jpg",
            ["image/png"] = ".png",
            ["image/webp"] = ".webp"
        };

    private readonly INewsArticleService _service;
    private readonly IWebHostEnvironment _environment;
    private readonly IAuditLogService _auditLogService;

    public NewsArticlesController(
        INewsArticleService service,
        IWebHostEnvironment environment,
        IAuditLogService auditLogService)
    {
        _service = service;
        _environment = environment;
        _auditLogService = auditLogService;
    }

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

    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _service.GetPublishedCategoriesAsync();
        return Ok(categories);
    }

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

    [HttpPost("upload-image")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxUploadRequestSize)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Hãy chọn một ảnh để upload.");

        if (file.Length > MaxImageSize)
            throw new ArgumentException("Ảnh không được lớn hơn 5 MB.");

        if (!AllowedImageTypes.TryGetValue(file.ContentType, out var extension))
        {
            throw new ArgumentException(
                "Định dạng ảnh không hợp lệ. Chỉ hỗ trợ JPG, PNG hoặc WebP.");
        }

        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
            webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");

        var uploadDirectory = Path.Combine(webRoot, "uploads", "news");
        Directory.CreateDirectory(uploadDirectory);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(uploadDirectory, fileName);

        await using (var stream = System.IO.File.Create(physicalPath))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = $"/uploads/news/{fileName}";
        var absoluteUrl = $"{Request.Scheme}://{Request.Host}{relativePath}";

        return Ok(new { url = absoluteUrl });
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> Create(CreateNewsArticleDto dto)
    {
        var article = await _service.CreateAsync(dto);

        await _auditLogService.LogFromUserAsync(
            User,
            "CREATE",
            "NewsArticle",
            article.Id,
            article.Slug,
            $"Tạo bài viết \"{article.Title}\".",
            newValue: article.IsPublished ? "Published" : "Draft");

        return StatusCode(StatusCodes.Status201Created, article);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> Update(Guid id, UpdateNewsArticleDto dto)
    {
        var before = await _service.GetByIdForManagementAsync(id);
        var success = await _service.UpdateAsync(id, dto);

        if (!success)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy bài viết.");
        }

        var after = await _service.GetByIdForManagementAsync(id);

        var auditAction =
            before != null && after != null && !before.IsPublished && after.IsPublished
                ? "PUBLISH"
                : before != null && after != null && before.IsPublished && !after.IsPublished
                    ? "UNPUBLISH"
                    : "UPDATE";

        await _auditLogService.LogFromUserAsync(
            User,
            auditAction,
            "NewsArticle",
            id,
            after?.Slug ?? before?.Slug,
            $"Cập nhật bài viết \"{after?.Title ?? before?.Title ?? id.ToString()}\".",
            before == null ? null : (before.IsPublished ? "Published" : "Draft"),
            after == null ? null : (after.IsPublished ? "Published" : "Draft"));

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var before = await _service.GetByIdForManagementAsync(id);
        var success = await _service.DeleteAsync(id);

        if (!success)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy bài viết.");
        }

        await _auditLogService.LogFromUserAsync(
            User,
            "DELETE",
            "NewsArticle",
            id,
            before?.Slug,
            $"Xóa bài viết \"{before?.Title ?? id.ToString()}\".",
            oldValue: before == null ? null : (before.IsPublished ? "Published" : "Draft"));

        return NoContent();
    }
}
