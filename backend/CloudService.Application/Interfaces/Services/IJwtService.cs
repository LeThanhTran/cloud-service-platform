using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public interface IJwtService
{
    string GenerateToken(AppUser user);
}