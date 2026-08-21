using CloudService.Application.DTOs.CustomerAccounts;

namespace CloudService.Application.Interfaces.Services;

public interface ICustomerAccountService
{
    Task<CustomerAccountOverviewDto> GetOverviewAsync(Guid userId);
    Task<IReadOnlyCollection<CustomerRequestItemDto>> GetRequestsAsync(Guid userId);
}
