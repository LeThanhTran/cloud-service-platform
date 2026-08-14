using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Data;

public class CloudServiceDbContext : DbContext
{
    public CloudServiceDbContext(
        DbContextOptions<CloudServiceDbContext> options)
        : base(options)
    {
    }

    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();

    public DbSet<ServicePlan> ServicePlans => Set<ServicePlan>();

    public DbSet<PlanPrice> PlanPrices => Set<PlanPrice>();

    public DbSet<Promotion> Promotions => Set<Promotion>();

    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();

    public DbSet<OrderRequest> OrderRequests => Set<OrderRequest>();

    public DbSet<AffiliateApplication> AffiliateApplications
        => Set<AffiliateApplication>();

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PlanPrice>()
            .Property(x => x.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Promotion>()
            .Property(x => x.DiscountPercent)
            .HasPrecision(5, 2);
    }
}