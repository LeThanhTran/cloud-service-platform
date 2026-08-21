using System.Security.Claims;
using CloudService.Application.DTOs.CustomerAccounts;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = AppRoles.User)]
public class AccountController : ControllerBase
{
    private readonly ICustomerAccountService _customerAccountService;

    public AccountController(ICustomerAccountService customerAccountService)
    {
        _customerAccountService = customerAccountService;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<CustomerAccountOverviewDto>> GetOverview()
    {
        return Ok(await _customerAccountService.GetOverviewAsync(GetCurrentUserId()));
    }

    [HttpGet("requests")]
    public async Task<ActionResult<IReadOnlyCollection<CustomerRequestItemDto>>> GetRequests()
    {
        return Ok(await _customerAccountService.GetRequestsAsync(GetCurrentUserId()));
    }

    private Guid GetCurrentUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(value, out var userId))
            throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại.");

        return userId;
    }
}
