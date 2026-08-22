using CloudService.Application.DTOs.ContactRequests;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Entities;
using Moq;

namespace CloudService.Tests.Application;

public class ContactRequestServiceTests
{
    private readonly Mock<IRepository<ContactRequest>> _repository = new();
    private readonly Mock<INotificationService> _notifications = new();
    private readonly Mock<IEmailSender> _emails = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    public ContactRequestServiceTests()
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
    public async Task CreateAsync_NormalizesInputAndCreatesReferenceCode()
    {
        ContactRequest? captured = null;
        _repository.Setup(r => r.AddAsync(It.IsAny<ContactRequest>()))
            .Callback<ContactRequest>(entity => captured = entity)
            .Returns(Task.CompletedTask);

        var result = await CreateService().CreateAsync(new CreateContactRequestDto
        {
            FullName = " Nguyễn Văn An ",
            Email = " TEST@Example.COM ",
            PhoneNumber = " 0912345678 ",
            Subject = " Tư vấn VPS ",
            Message = " Cần tư vấn "
        });

        Assert.NotNull(captured);
        Assert.Equal("Nguyễn Văn An", captured!.FullName);
        Assert.Equal("test@example.com", captured.Email);
        Assert.Equal("New", result.Status);
        Assert.StartsWith("CON-", result.ReferenceCode);
        _notifications.Verify(n => n.CreateForRolesAsync(
            It.IsAny<IEnumerable<string>>(), It.IsAny<string>(), It.IsAny<string>(), "Contact", "/admin/contacts"), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_NewToProcessing_SendsEmailAndNotification()
    {
        var contact = ContactWithStatus("New");
        _repository.Setup(r => r.GetByIdAsync(contact.Id)).ReturnsAsync(contact);

        var result = await CreateService().UpdateStatusAsync(
            contact.Id,
            new UpdateContactStatusDto { Status = "Processing" });

        Assert.NotNull(result);
        Assert.Equal("Processing", result!.Status);
        _notifications.Verify(n => n.CreateForUserByEmailAsync(
            contact.Email, It.IsAny<string>(), It.IsAny<string>(), "Contact", "/account/requests"), Times.Once);
        _emails.Verify(e => e.SendAsync(contact.Email, It.IsAny<string>(), It.Is<string>(html => html.Contains(contact.ReferenceCode!))), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_ProcessingToResolved_IsAllowed()
    {
        var contact = ContactWithStatus("Processing");
        _repository.Setup(r => r.GetByIdAsync(contact.Id)).ReturnsAsync(contact);

        var result = await CreateService().UpdateStatusAsync(
            contact.Id,
            new UpdateContactStatusDto { Status = "Resolved" });

        Assert.Equal("Resolved", result!.Status);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_ResolvedToProcessing_ThrowsInvalidOperationException()
    {
        var contact = ContactWithStatus("Resolved");
        _repository.Setup(r => r.GetByIdAsync(contact.Id)).ReturnsAsync(contact);

        await Assert.ThrowsAsync<InvalidOperationException>(() => CreateService().UpdateStatusAsync(
            contact.Id,
            new UpdateContactStatusDto { Status = "Processing" }));
    }

    [Fact]
    public async Task GetForManagementAsync_WithPageSizeTen_ReturnsTenItemsAndSecondPageMetadata()
    {
        var contacts = Enumerable.Range(1, 15)
            .Select(i => new ContactRequest
            {
                FullName = $"Customer {i}",
                Email = $"c{i}@example.com",
                Subject = "Subject",
                Message = "Message",
                Status = "New",
                CreatedAt = DateTime.UtcNow.AddMinutes(-i)
            })
            .ToArray();
        _repository.Setup(r => r.GetAllAsync()).ReturnsAsync(contacts);

        var result = await CreateService().GetForManagementAsync(null, null, "latest", 1, 10);

        Assert.Equal(10, result.Items.Count());
        Assert.Equal(15, result.TotalItems);
        Assert.Equal(2, result.TotalPages);
        Assert.Equal(10, result.PageSize);
    }


    [Fact]
    public async Task UpdateStatusAsync_SameStatus_DoesNotNotifyCustomer()
    {
        var contact = ContactWithStatus("Processing");
        _repository.Setup(r => r.GetByIdAsync(contact.Id)).ReturnsAsync(contact);

        var result = await CreateService().UpdateStatusAsync(
            contact.Id,
            new UpdateContactStatusDto { Status = " processing " });

        Assert.Equal("Processing", result!.Status);
        _notifications.Verify(n => n.CreateForUserByEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        _emails.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_WithInvalidStatus_ThrowsArgumentException()
    {
        var contact = ContactWithStatus("New");
        _repository.Setup(r => r.GetByIdAsync(contact.Id)).ReturnsAsync(contact);

        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().UpdateStatusAsync(
            contact.Id,
            new UpdateContactStatusDto { Status = "Closed" }));
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenContactMissing_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((ContactRequest?)null);

        var result = await CreateService().UpdateStatusAsync(
            id,
            new UpdateContactStatusDto { Status = "Processing" });

        Assert.Null(result);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task GetForManagementAsync_FiltersBySearchAndStatus()
    {
        var matching = ContactWithStatus("Processing");
        matching.Subject = "Cloud VPS Support";
        matching.CreatedAt = DateTime.UtcNow;
        var other = ContactWithStatus("New");
        other.Email = "other@example.com";
        other.Subject = "Domain Support";
        other.CreatedAt = DateTime.UtcNow.AddMinutes(-1);
        _repository.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { matching, other });

        var result = await CreateService().GetForManagementAsync(
            "Cloud VPS", "Processing", "latest", 1, 10);

        var item = Assert.Single(result.Items);
        Assert.Equal(matching.Id, item.Id);
        Assert.Equal(1, result.TotalItems);
    }

    [Fact]
    public async Task GetForManagementAsync_WithInvalidSort_ThrowsArgumentException()
    {
        _repository.Setup(r => r.GetAllAsync()).ReturnsAsync(Array.Empty<ContactRequest>());

        await Assert.ThrowsAsync<ArgumentException>(() =>
            CreateService().GetForManagementAsync(null, null, "random", 1, 10));
    }

    private ContactRequestService CreateService() => new(
        _repository.Object,
        _notifications.Object,
        _emails.Object,
        _unitOfWork.Object);

    private static ContactRequest ContactWithStatus(string status) => new()
    {
        FullName = "Customer",
        Email = "customer@example.com",
        Subject = "Support",
        Message = "Help",
        Status = status,
        ReferenceCode = "CON-20260821-ABC234"
    };
}
