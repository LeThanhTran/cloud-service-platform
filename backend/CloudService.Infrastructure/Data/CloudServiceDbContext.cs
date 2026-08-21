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

    public DbSet<AppUser> AppUsers { get; set; }

    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();

    public DbSet<OrderRequest> OrderRequests => Set<OrderRequest>();

    public DbSet<AffiliateApplication> AffiliateApplications
        => Set<AffiliateApplication>();

    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();

    public DbSet<Notification> Notifications => Set<Notification>();

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


        modelBuilder.Entity<OrderRequest>(entity =>
        {
            entity.Property(x => x.ReferenceCode)
                .HasMaxLength(30);

            entity.HasIndex(x => x.ReferenceCode)
                .IsUnique()
                .HasFilter("[ReferenceCode] IS NOT NULL");
        });

        modelBuilder.Entity<AffiliateApplication>(entity =>
        {
            entity.Property(x => x.ReferenceCode)
                .HasMaxLength(30);

            entity.HasIndex(x => x.ReferenceCode)
                .IsUnique()
                .HasFilter("[ReferenceCode] IS NOT NULL");
        });

        modelBuilder.Entity<ContactRequest>(entity =>
        {
            entity.Property(x => x.ReferenceCode)
                .HasMaxLength(30);

            entity.HasIndex(x => x.ReferenceCode)
                .IsUnique()
                .HasFilter("[ReferenceCode] IS NOT NULL");

            entity.Property(x => x.FullName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.PhoneNumber)
                .HasMaxLength(30);

            entity.Property(x => x.Subject)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.Message)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(x => x.Status)
                .HasMaxLength(30)
                .IsRequired();

            entity.HasIndex(x => x.Status);
            entity.HasIndex(x => x.CreatedAt);
        });


        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(x => x.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.Message)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(x => x.Type)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.Link)
                .HasMaxLength(300)
                .IsRequired();

            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => new { x.UserId, x.IsRead });

            entity.HasOne<AppUser>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(x => x.UserId)
                .HasMaxLength(64)
                .IsRequired();

            entity.Property(x => x.UserName)
                .HasMaxLength(150);

            entity.Property(x => x.UserRole)
                .HasMaxLength(50);

            entity.Property(x => x.Action)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.EntityType)
                .HasMaxLength(80);

            entity.Property(x => x.ReferenceCode)
                .HasMaxLength(80);

            entity.Property(x => x.Description)
                .HasMaxLength(1000);

            entity.Property(x => x.OldValue)
                .HasMaxLength(500);

            entity.Property(x => x.NewValue)
                .HasMaxLength(500);

            entity.HasIndex(x => x.CreatedAt);
            entity.HasIndex(x => x.Action);
            entity.HasIndex(x => x.EntityType);
            entity.HasIndex(x => x.UserId);
        });

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasIndex(x => x.Email)
                .IsUnique();

            entity.Property(x => x.FullName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.PasswordHash)
                .IsRequired();

            entity.Property(x => x.Role)
                .HasMaxLength(50)
                .IsRequired();
        });
    }
}