using CloudService.Application.DTOs.ServicePlans;
using CloudService.Application.Interfaces.QrCodes;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicePlansController : ControllerBase
{
    private readonly IServicePlanService _service;
    private readonly IQrCodeGeneratorFactory _qrCodeGeneratorFactory;
    private readonly IConfiguration _configuration;

    public ServicePlansController(
        IServicePlanService service,
        IQrCodeGeneratorFactory qrCodeGeneratorFactory,
        IConfiguration configuration)
    {
        _service = service;
        _qrCodeGeneratorFactory = qrCodeGeneratorFactory;
        _configuration = configuration;
    }

    // GET: api/ServicePlans
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    // GET: api/ServicePlans/{id}
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    // GET: api/ServicePlans/{id}/qr-code?format=png
    // Public endpoint để frontend có thể hiển thị QR cho từng gói dịch vụ.
    [HttpGet("{id:guid}/qr-code")]
    [AllowAnonymous]
    public async Task<IActionResult> GetQrCode(
        Guid id,
        [FromQuery] string format = "png")
    {
        var plan = await _service.GetByIdAsync(id);

        if (plan == null)
            return NotFound(new { message = "Không tìm thấy gói dịch vụ." });

        if (!TryParseQrCodeFormat(format, out var qrFormat))
        {
            return BadRequest(new
            {
                message = "Định dạng QR không hợp lệ. Chỉ hỗ trợ png hoặc svg."
            });
        }

        var result = GenerateQrCode(id, qrFormat);

        // Không đặt tên tải xuống ở GET để frontend có thể dùng trực tiếp
        // endpoint này làm src cho thẻ <img>.
        return File(result.Data, result.ContentType);
    }

    // POST: api/ServicePlans/{id}/qr-code/regenerate?format=png
    // Admin có thể chủ động sinh lại QR khi cần.
    [HttpPost("{id:guid}/qr-code/regenerate")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> RegenerateQrCode(
        Guid id,
        [FromQuery] string format = "png")
    {
        var plan = await _service.GetByIdAsync(id);

        if (plan == null)
            return NotFound(new { message = "Không tìm thấy gói dịch vụ." });

        if (!TryParseQrCodeFormat(format, out var qrFormat))
        {
            return BadRequest(new
            {
                message = "Định dạng QR không hợp lệ. Chỉ hỗ trợ png hoặc svg."
            });
        }

        var result = GenerateQrCode(id, qrFormat);

        return File(
            result.Data,
            result.ContentType,
            $"service-plan-{id}.{result.FileExtension}");
    }

    // POST: api/ServicePlans
    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Create(
        [FromBody] CreateServicePlanDto dto)
    {
        var result = await _service.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result);
    }

    // PUT: api/ServicePlans/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateServicePlanDto dto)
    {
        var success = await _service.UpdateAsync(id, dto);

        if (!success)
            return NotFound();

        return NoContent();
    }

    // DELETE: api/ServicePlans/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _service.DeleteAsync(id);

        if (!success)
            return NotFound();

        return NoContent();
    }

    private QrCodeResult GenerateQrCode(Guid servicePlanId, QrCodeFormat format)
    {
        var frontendBaseUrl =
            _configuration["Frontend:BaseUrl"]?.TrimEnd('/')
            ?? "http://localhost:3000";

        var targetUrl = $"{frontendBaseUrl}/services/{servicePlanId}";
        var generator = _qrCodeGeneratorFactory.Create(format);

        return generator.Generate(targetUrl);
    }

    private static bool TryParseQrCodeFormat(
        string? value,
        out QrCodeFormat format)
    {
        if (Enum.TryParse(value, true, out format) &&
            Enum.IsDefined(typeof(QrCodeFormat), format))
        {
            return true;
        }

        format = QrCodeFormat.Png;
        return false;
    }
}
