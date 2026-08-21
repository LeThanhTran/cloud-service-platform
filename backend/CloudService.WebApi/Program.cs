using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.QrCodes;
using CloudService.Application.Interfaces.Services;
using CloudService.Application.Services;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;
using CloudService.Infrastructure.Exports;
using CloudService.Infrastructure.Repositories;
using CloudService.WebApi.ErrorHandling;
using CloudService.WebApi.Services;
using CloudService.WebApi.Services.Email;
using CloudService.WebApi.Services.QrCodes;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// CORS cho phép frontend Next.js gọi Web API từ trình duyệt.
var frontendBaseUrl =
    (builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:3000")
    .TrimEnd('/');

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(frontendBaseUrl)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Chuẩn hóa response lỗi theo RFC 7807 ProblemDetails.
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] =
            context.HttpContext.TraceIdentifier;
    };
});

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// Rate limiting cho các endpoint công khai nhạy cảm để giảm brute force / spam.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/problem+json";

        await context.HttpContext.Response.WriteAsJsonAsync(
            new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Status = StatusCodes.Status429TooManyRequests,
                Title = "Too Many Requests",
                Detail = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút."
            },
            cancellationToken);
    };

    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("request-tracking", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

// Health check xác nhận cả Web API và kết nối SQL Server.
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database");

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT Token theo dạng: Bearer {your token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database
builder.Services.AddDbContext<CloudServiceDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Repository Pattern
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Unit of Work Pattern
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Application Services
builder.Services.AddScoped<IServiceCategoryService, ServiceCategoryService>();
builder.Services.AddScoped<IServicePlanService, ServicePlanService>();
builder.Services.AddScoped<IPlanPriceService, PlanPriceService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<INewsArticleService, NewsArticleService>();
builder.Services.AddScoped<IOrderRequestService, OrderRequestService>();
builder.Services.AddScoped<IOrderExcelExportService, OrderExcelExportService>();
builder.Services.AddScoped<IAffiliateApplicationService, AffiliateApplicationService>();
builder.Services.AddScoped<IContactRequestService, ContactRequestService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ICustomerAccountService, CustomerAccountService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IRequestTrackingService, RequestTrackingService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddSingleton<IQrCodeGeneratorFactory, QrCodeGeneratorFactory>();

// Authentication Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();

// Password Hasher
builder.Services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");

var key = jwtSettings["Key"];

if (string.IsNullOrWhiteSpace(key) || key.Length < 32)
{
    throw new InvalidOperationException(
        "JWT Key chưa được cấu hình hoặc quá ngắn. " +
        "Hãy dùng User Secrets khi chạy local hoặc biến môi trường Jwt__Key khi chạy Docker/Production.");
}

var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"];

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,

            ValidateAudience = true,
            ValidAudience = audience,

            ValidateLifetime = true,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(key))
        };

        // Không chỉ tin role/active state đã nằm trong JWT cũ.
        // Mỗi request xác nhận lại tài khoản hiện tại để thao tác đổi quyền
        // hoặc khóa tài khoản có hiệu lực ngay, không phải chờ token hết hạn.
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var userIdValue =
                    context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);

                if (!Guid.TryParse(userIdValue, out var userId))
                {
                    context.Fail("Không xác định được tài khoản từ access token.");
                    return;
                }

                var dbContext =
                    context.HttpContext.RequestServices
                        .GetRequiredService<CloudServiceDbContext>();

                var currentUser = await dbContext.AppUsers
                    .AsNoTracking()
                    .Where(user => user.Id == userId)
                    .Select(user => new
                    {
                        user.IsActive,
                        user.Role
                    })
                    .FirstOrDefaultAsync();

                if (currentUser == null || !currentUser.IsActive)
                {
                    context.Fail("Tài khoản không còn hoạt động.");
                    return;
                }

                var tokenRole =
                    context.Principal?.FindFirstValue(ClaimTypes.Role);

                if (!string.Equals(
                        currentUser.Role,
                        tokenRole,
                        StringComparison.OrdinalIgnoreCase))
                {
                    context.Fail(
                        "Quyền tài khoản đã thay đổi. Vui lòng làm mới phiên hoặc đăng nhập lại.");
                }
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Phục vụ ảnh News đã upload từ wwwroot/uploads/news.
app.UseStaticFiles();

// Endpoint-specific rate limiting cần routing chạy trước.
app.UseRouting();

// CORS phải chạy trước Authentication/Authorization để frontend nhận
// được CORS headers kể cả khi API trả về 401/403.
app.UseCors("Frontend");

app.UseRateLimiter();

// Authentication phải đứng trước Authorization
app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// Trong môi trường Docker, SQL Server có thể cần vài giây để sẵn sàng.
// Chỉ bật cơ chế migrate tự động khi Database:ApplyMigrationsOnStartup = true,
// vì vậy luồng chạy local hiện tại không bị thay đổi.
if (builder.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup"))
{
    const int maxAttempts = 20;
    var attempt = 0;

    while (true)
    {
        attempt++;

        try
        {
            using var scope = app.Services.CreateScope();
            var dbContext =
                scope.ServiceProvider.GetRequiredService<CloudServiceDbContext>();

            await dbContext.Database.MigrateAsync();

            app.Logger.LogInformation(
                "Database migrations applied successfully on attempt {Attempt}.",
                attempt);

            // Development/Docker demo accounts.
            // This is deliberately opt-in and never runs unless both the
            // environment is Development and Database:SeedDemoUsers = true.
            if (app.Environment.IsDevelopment() &&
                builder.Configuration.GetValue<bool>("Database:SeedDemoUsers"))
            {
                var passwordHasher =
                    scope.ServiceProvider.GetRequiredService<IPasswordHasher<AppUser>>();

                var demoPassword =
                    builder.Configuration["DemoUsers:Password"] ?? "123456";

                var demoUsers = new[]
                {
                    new { FullName = "Admin", Email = "admin@novacloud.local", Role = AppRoles.Admin },
                    new { FullName = "Editor", Email = "editor@novacloud.local", Role = AppRoles.Editor },
                    new { FullName = "User", Email = "user@novacloud.local", Role = AppRoles.User }
                };

                foreach (var demo in demoUsers)
                {
                    var normalizedEmail = demo.Email.ToLower();

                    var exists = await dbContext.AppUsers
                        .AnyAsync(x => x.Email.ToLower() == normalizedEmail);

                    if (exists)
                        continue;

                    var user = new AppUser
                    {
                        FullName = demo.FullName,
                        Email = demo.Email,
                        Role = demo.Role,
                        IsActive = true
                    };

                    user.PasswordHash =
                        passwordHasher.HashPassword(user, demoPassword);

                    dbContext.AppUsers.Add(user);
                }

                await dbContext.SaveChangesAsync();

                app.Logger.LogInformation(
                    "Docker demo users are ready: Admin, Editor and User.");
            }

            break;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            app.Logger.LogWarning(
                ex,
                "Database is not ready yet. Migration attempt {Attempt}/{MaxAttempts} failed. Retrying in 3 seconds...",
                attempt,
                maxAttempts);

            await Task.Delay(TimeSpan.FromSeconds(3));
        }
    }
}

app.Run();

