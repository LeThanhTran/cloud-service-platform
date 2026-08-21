using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.ContactRequests;
using CloudService.Application.Emails;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Utilities;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class ContactRequestService : IContactRequestService
{
    private const int MaxPageSize = 100;
    private static readonly string[] AllowedStatuses = new[] { "New", "Processing", "Resolved" };

    private readonly IRepository<ContactRequest> _repository;
    private readonly INotificationService _notificationService;
    private readonly IEmailSender _emailSender;
    private readonly IUnitOfWork _unitOfWork;

    public ContactRequestService(
        IRepository<ContactRequest> repository,
        INotificationService notificationService,
        IEmailSender emailSender,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _notificationService = notificationService;
        _emailSender = emailSender;
        _unitOfWork = unitOfWork;
    }

    public async Task<ContactRequestDto> CreateAsync(CreateContactRequestDto dto)
    {
        var entity = new ContactRequest
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            PhoneNumber = NormalizeOptional(dto.PhoneNumber),
            Subject = dto.Subject.Trim(),
            Message = dto.Message.Trim(),
            Status = "New"
        };
        entity.ReferenceCode = ReferenceCodeGenerator.Create("CON", entity.CreatedAt);

        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        await _notificationService.CreateForRolesAsync(
            new[] { AppRoles.Admin, AppRoles.Editor },
            "Liên hệ mới",
            $"[{entity.ReferenceCode}] {entity.FullName}: {entity.Subject}",
            "Contact",
            "/admin/contacts");

        return Map(entity);
    }

    public async Task<PagedResultDto<ContactRequestDto>> GetForManagementAsync(
        string? search,
        string? status,
        string? sort,
        int page,
        int pageSize)
    {
        ValidatePaging(page, pageSize);
        var requests = (await _repository.GetAllAsync()).AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            requests = requests.Where(request =>
                request.FullName.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                request.Email.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                (request.PhoneNumber?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false) ||
                request.Subject.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                request.Message.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                ReferenceCodeGenerator.GetDisplayCode("CON", request.ReferenceCode, request.CreatedAt, request.Id)
                    .Contains(keyword, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = NormalizeStatus(status);
            requests = requests.Where(request =>
                string.Equals(request.Status, normalizedStatus, StringComparison.OrdinalIgnoreCase));
        }

        requests = NormalizeSort(sort) switch
        {
            "oldest" => requests.OrderBy(request => request.CreatedAt),
            "status" => requests.OrderBy(request => StatusOrder(request.Status))
                .ThenByDescending(request => request.CreatedAt),
            _ => requests.OrderByDescending(request => request.CreatedAt)
        };

        var materialized = requests.ToList();
        var totalItems = materialized.Count;
        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        return new PagedResultDto<ContactRequestDto>
        {
            Items = materialized
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(Map)
                .ToArray(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }

    public async Task<ContactRequestDto?> GetByIdAsync(Guid id)
    {
        var request = await _repository.GetByIdAsync(id);
        return request == null ? null : Map(request);
    }

    public async Task<ContactRequestDto?> UpdateStatusAsync(Guid id, UpdateContactStatusDto dto)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null)
            return null;

        var nextStatus = NormalizeStatus(dto.Status);
        EnsureValidTransition(request.Status, nextStatus);
        var statusChanged = !string.Equals(
            request.Status,
            nextStatus,
            StringComparison.OrdinalIgnoreCase);

        request.Status = nextStatus;
        request.UpdatedAt = DateTime.UtcNow;
        _repository.Update(request);
        await _unitOfWork.SaveChangesAsync();

        if (statusChanged)
        {
            var statusMessage = BuildContactStatusMessage(nextStatus);

            await _notificationService.CreateForUserByEmailAsync(
                request.Email,
                "Cập nhật yêu cầu liên hệ",
                statusMessage,
                "Contact",
                "/account/requests");

            await _emailSender.SendAsync(
                request.Email,
                "[NovaCloud] Cập nhật yêu cầu liên hệ",
                EmailTemplates.ContactStatus(
                    request.FullName,
                    ReferenceCodeGenerator.GetDisplayCode("CON", request.ReferenceCode, request.CreatedAt, request.Id),
                    request.Subject,
                    nextStatus,
                    statusMessage));
        }

        return Map(request);
    }

    private static string BuildContactStatusMessage(string status) =>
        status switch
        {
            "Processing" =>
                "Yêu cầu liên hệ của bạn đang được NovaCloud xử lý.",
            "Resolved" =>
                "Yêu cầu liên hệ của bạn đã được NovaCloud xử lý xong.",
            _ =>
                "Yêu cầu liên hệ của bạn đã được cập nhật."
        };

    private static void EnsureValidTransition(string currentStatus, string nextStatus)
    {
        var current = NormalizeStatus(currentStatus);

        if (string.Equals(current, nextStatus, StringComparison.OrdinalIgnoreCase))
            return;

        var valid = current switch
        {
            "New" => nextStatus == "Processing",
            "Processing" => nextStatus == "Resolved",
            "Resolved" => false,
            _ => false
        };

        if (!valid)
        {
            throw new InvalidOperationException(
                $"Không thể chuyển trạng thái liên hệ từ {current} sang {nextStatus}. " +
                "Luồng hợp lệ: New → Processing → Resolved.");
        }
    }

    private static string NormalizeStatus(string status)
    {
        var match = AllowedStatuses.FirstOrDefault(allowed =>
            string.Equals(allowed, status?.Trim(), StringComparison.OrdinalIgnoreCase));

        return match ?? throw new ArgumentException(
            "Trạng thái không hợp lệ. Dùng New, Processing hoặc Resolved.");
    }

    private static string NormalizeSort(string? sort)
    {
        if (string.IsNullOrWhiteSpace(sort))
            return "latest";

        var normalized = sort.Trim().ToLowerInvariant();
        if (normalized is "latest" or "oldest" or "status")
            return normalized;

        throw new ArgumentException("Sort không hợp lệ. Dùng latest, oldest hoặc status.");
    }

    private static int StatusOrder(string status) => status switch
    {
        "New" => 1,
        "Processing" => 2,
        "Resolved" => 3,
        _ => 4
    };

    private static void ValidatePaging(int page, int pageSize)
    {
        if (page < 1)
            throw new ArgumentException("Page phải lớn hơn hoặc bằng 1.");

        if (pageSize < 1 || pageSize > MaxPageSize)
            throw new ArgumentException($"PageSize phải nằm trong khoảng từ 1 đến {MaxPageSize}.");
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ContactRequestDto Map(ContactRequest request) => new()
    {
        Id = request.Id,
        ReferenceCode = ReferenceCodeGenerator.GetDisplayCode("CON", request.ReferenceCode, request.CreatedAt, request.Id),
        FullName = request.FullName,
        Email = request.Email,
        PhoneNumber = request.PhoneNumber,
        Subject = request.Subject,
        Message = request.Message,
        Status = request.Status,
        CreatedAt = request.CreatedAt,
        UpdatedAt = request.UpdatedAt
    };
}
