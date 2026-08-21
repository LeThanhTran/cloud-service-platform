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
