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

    public NewsArticlesController(
        INewsArticleService service,
        IWebHostEnvironment environment)
    {
        _service = service;
        _environment = environment;
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
    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _service.GetPublishedCategoriesAsync();
        return Ok(categories);
    }

    // Admin/Editor: xem cả bài nháp và bài đã publish.
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

    // Admin/Editor: upload ảnh thumbnail cho bài viết.
    // File được lưu trong wwwroot/uploads/news, DB chỉ lưu URL trả về.
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
        return StatusCode(StatusCodes.Status201Created, article);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.AdminOrEditor)]
    public async Task<IActionResult> Update(Guid id, UpdateNewsArticleDto dto)
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
