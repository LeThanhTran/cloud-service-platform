using CloudService.Application.DTOs.AffiliateApplications;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Entities;
using Moq;

namespace CloudService.Tests.Application;

public class AffiliateApplicationServiceTests
{
    private readonly Mock<IRepository<AffiliateApplication>> _repository = new();
    private readonly Mock<INotificationService> _notifications = new();
    private readonly Mock<IEmailSender> _emails = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    public AffiliateApplicationServiceTests()
    {
        _unitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _notifications.Setup(n => n.CreateForRolesAsync(
            It.IsAny<IEnumerable<string>>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _notifications.Setup(n => n.CreateForUserByEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _emails.Setup(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(true);
    }

    [Fact]
    public async Task CreateAsync_CreatesNewApplicationAndReferenceCode()
    {
        AffiliateApplication? captured = null;
        _repository.Setup(r => r.AddAsync(It.IsAny<AffiliateApplication>()))
            .Callback<AffiliateApplication>(entity => captured = entity)
            .Returns(Task.CompletedTask);

        var result = await CreateService().CreateAsync(new CreateAffiliateApplicationDto
        {
            FullName = " Partner ",
            Email = " PARTNER@Example.COM ",
            PhoneNumber = " 0909123456 ",
            CompanyName = " Test Company ",
            Website = " https://example.com ",
            Note = " Demo "
        });

        Assert.NotNull(captured);
        Assert.Equal("partner@example.com", captured!.Email);
        Assert.Equal("New", result.Status);
        Assert.StartsWith("AFF-", result.ReferenceCode);
        _notifications.Verify(n => n.CreateForRolesAsync(
            It.IsAny<IEnumerable<string>>(), It.IsAny<string>(), It.IsAny<string>(), "Affiliate", "/admin/affiliates"), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_NewToProcessing_IsAllowedAndNotifiesCustomer()
    {
        var application = ApplicationWithStatus("New");
        _repository.Setup(r => r.GetByIdAsync(application.Id)).ReturnsAsync(application);

        var result = await CreateService().UpdateStatusAsync(
            application.Id,
            new UpdateAffiliateStatusDto { Status = "Processing" });

        Assert.Equal("Processing", result!.Status);
        _notifications.Verify(n => n.CreateForUserByEmailAsync(
            application.Email, It.IsAny<string>(), It.IsAny<string>(), "Affiliate", "/account/requests"), Times.Once);
        _emails.Verify(e => e.SendAsync(application.Email, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_ProcessingToCompleted_IsAllowed()
    {
        var application = ApplicationWithStatus("Processing");
        _repository.Setup(r => r.GetByIdAsync(application.Id)).ReturnsAsync(application);

        var result = await CreateService().UpdateStatusAsync(
            application.Id,
            new UpdateAffiliateStatusDto { Status = "Completed" });

        Assert.Equal("Completed", result!.Status);
    }

    [Fact]
    public async Task UpdateStatusAsync_CompletedToProcessing_ThrowsInvalidOperationException()
    {
        var application = ApplicationWithStatus("Completed");
        _repository.Setup(r => r.GetByIdAsync(application.Id)).ReturnsAsync(application);

        await Assert.ThrowsAsync<InvalidOperationException>(() => CreateService().UpdateStatusAsync(
            application.Id,
            new UpdateAffiliateStatusDto { Status = "Processing" }));
    }


    [Fact]
    public async Task UpdateStatusAsync_NewToRejected_IsAllowed()
    {
        var application = ApplicationWithStatus("New");
        _repository.Setup(r => r.GetByIdAsync(application.Id)).ReturnsAsync(application);

        var result = await CreateService().UpdateStatusAsync(
            application.Id,
            new UpdateAffiliateStatusDto { Status = "Rejected" });

        Assert.Equal("Rejected", result!.Status);
        _notifications.Verify(n => n.CreateForUserByEmailAsync(
            application.Email, It.IsAny<string>(), It.IsAny<string>(), "Affiliate", "/account/requests"), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_SameStatus_DoesNotNotifyCustomer()
    {
        var application = ApplicationWithStatus("Processing");
        _repository.Setup(r => r.GetByIdAsync(application.Id)).ReturnsAsync(application);

        var result = await CreateService().UpdateStatusAsync(
            application.Id,
            new UpdateAffiliateStatusDto { Status = " processing " });

        Assert.Equal("Processing", result!.Status);
        _notifications.Verify(n => n.CreateForUserByEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        _emails.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_WithInvalidStatus_ThrowsArgumentException()
    {
        var application = ApplicationWithStatus("New");
        _repository.Setup(r => r.GetByIdAsync(application.Id)).ReturnsAsync(application);

        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().UpdateStatusAsync(
            application.Id,
            new UpdateAffiliateStatusDto { Status = "Archived" }));
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenApplicationMissing_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((AffiliateApplication?)null);

        var result = await CreateService().UpdateStatusAsync(
            id,
            new UpdateAffiliateStatusDto { Status = "Processing" });

        Assert.Null(result);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task GetForManagementAsync_FiltersByCompanyAndStatus()
    {
        var matching = ApplicationWithStatus("Processing");
        matching.CompanyName = "Nova Partner";
        matching.CreatedAt = DateTime.UtcNow;
        var other = ApplicationWithStatus("New");
        other.CompanyName = "Other Company";
        other.Email = "other@example.com";
        other.CreatedAt = DateTime.UtcNow.AddMinutes(-1);
        _repository.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { matching, other });

        var result = await CreateService().GetForManagementAsync(
            "Nova Partner", "Processing", "latest", 1, 10);

        var item = Assert.Single(result.Items);
        Assert.Equal(matching.Id, item.Id);
        Assert.Equal(1, result.TotalItems);
    }

    [Fact]
    public async Task GetForManagementAsync_WithInvalidPageSize_ThrowsArgumentException()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            CreateService().GetForManagementAsync(null, null, "latest", 1, 101));
    }

    private AffiliateApplicationService CreateService() => new(
        _repository.Object,
        _notifications.Object,
        _emails.Object,
        _unitOfWork.Object);

    private static AffiliateApplication ApplicationWithStatus(string status) => new()
    {
        FullName = "Partner",
        Email = "partner@example.com",
        PhoneNumber = "0909123456",
        Status = status,
        ReferenceCode = "AFF-20260821-ABC234"
    };
}
