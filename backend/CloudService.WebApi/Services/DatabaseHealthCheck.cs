using CloudService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace CloudService.WebApi.Services;

public sealed class DatabaseHealthCheck : IHealthCheck
{
    private readonly CloudServiceDbContext _dbContext;

    public DatabaseHealthCheck(CloudServiceDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);

            return canConnect
                ? HealthCheckResult.Healthy("SQL Server connection is available.")
                : HealthCheckResult.Unhealthy("SQL Server connection is unavailable.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                "SQL Server health check failed.",
                ex);
        }
    }
}
