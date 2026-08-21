using CloudService.Application.DTOs.RequestTracking;
using CloudService.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/request-tracking")]
public class RequestTrackingController : ControllerBase
{
    private readonly IRequestTrackingService _service;

    public RequestTrackingController(IRequestTrackingService service)
    {
        _service = service;
    }

    [HttpPost("lookup")]
    [AllowAnonymous]
    [EnableRateLimiting("request-tracking")]
    public async Task<IActionResult> Lookup(RequestTrackingLookupDto dto)
    {
        var result = await _service.LookupAsync(dto);
        if (result == null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Không tìm thấy yêu cầu",
                detail: "Mã yêu cầu hoặc email không khớp. Vui lòng kiểm tra lại thông tin đã nhập.");
        }

        return Ok(result);
    }
}
