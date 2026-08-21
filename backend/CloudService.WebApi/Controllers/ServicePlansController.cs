using CloudService.Application.DTOs.ServicePlans;
using CloudService.Application.Interfaces.QrCodes;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using CloudService.WebApi.Utilities;
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
    private readonly IAuditLogService _auditLogService;

    public ServicePlansController(
        IServicePlanService service,
        IQrCodeGeneratorFactory qrCodeGeneratorFactory,
        IConfiguration configuration,
        IAuditLogService auditLogService)
    {
        _service = service;
        _qrCodeGeneratorFactory = qrCodeGeneratorFactory;
        _configuration = configuration;
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

    [HttpGet("{id:guid}/qr-code")]
    [AllowAnonymous]
    public async Task<IActionResult> GetQrCode(
        Guid id,
        [FromQuery] string format = "png")
    {
        var plan = await _service.GetByIdAsync(id);

        if (plan == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy gói dịch vụ.");
        }

        if (!TryParseQrCodeFormat(format, out var qrFormat))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bad Request",
                detail: "Định dạng QR không hợp lệ. Chỉ hỗ trợ png hoặc svg.");
        }

        var result = GenerateQrCode(id, qrFormat);
        return File(result.Data, result.ContentType);
    }

    [HttpPost("{id:guid}/qr-code/regenerate")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> RegenerateQrCode(
        Guid id,
        [FromQuery] string format = "png")
    {
        var plan = await _service.GetByIdAsync(id);

        if (plan == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource Not Found",
                detail: "Không tìm thấy gói dịch vụ.");
        }

        if (!TryParseQrCodeFormat(format, out var qrFormat))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bad Request",
                detail: "Định dạng QR không hợp lệ. Chỉ hỗ trợ png hoặc svg.");
        }

        var result = GenerateQrCode(id, qrFormat);

        await _auditLogService.LogFromUserAsync(
            User,
            "REGENERATE_QR",
            "ServicePlan",
            plan.Id,
            plan.Name,
            $"Sinh lại QR code định dạng {qrFormat} cho gói dịch vụ {plan.Name}.");

        return File(
            result.Data,
            result.ContentType,
            $"service-plan-{id}.{result.FileExtension}");
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Create(
        [FromBody] CreateServicePlanDto dto)
    {
        var result = await _service.CreateAsync(dto);

        await _auditLogService.LogFromUserAsync(
            User,
            "CREATE",
            "ServicePlan",
            result.Id,
            result.Name,
            $"Tạo gói dịch vụ {result.Name}.",
            newValue: $"Active={result.IsActive}; CPU={result.CpuCores}; RAM={result.RamGB}GB; Storage={result.StorageGB}GB");

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateServicePlanDto dto)
    {
        var before = await _service.GetByIdAsync(id);
        var success = await _service.UpdateAsync(id, dto);

        if (!success)
            return NotFound();

        var after = await _service.GetByIdAsync(id);

        await _auditLogService.LogFromUserAsync(
            User,
            "UPDATE",
            "ServicePlan",
            id,
            after?.Name ?? before?.Name,
            $"Cập nhật gói dịch vụ {after?.Name ?? before?.Name ?? id.ToString()}.",
            before == null ? null : $"Name={before.Name}; Active={before.IsActive}; Featured={before.IsFeatured}",
            after == null ? null : $"Name={after.Name}; Active={after.IsActive}; Featured={after.IsFeatured}");

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
            "ServicePlan",
            id,
            before?.Name,
            $"Xóa gói dịch vụ {before?.Name ?? id.ToString()}.",
            oldValue: before == null ? null : $"Name={before.Name}; Active={before.IsActive}");

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
