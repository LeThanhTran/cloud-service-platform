using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.OrderRequests;
using CloudService.Application.Emails;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Utilities;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Interfaces.Services;

public class OrderRequestService : IOrderRequestService
{
    private const int MaxPageSize = 100;
    private static readonly string[] AllowedBillingCycles = new[] { "Monthly", "Yearly" };

    private readonly IRepository<OrderRequest> _repository;
    private readonly IRepository<ServicePlan> _servicePlanRepository;
    private readonly IRepository<PlanPrice> _planPriceRepository;
    private readonly INotificationService _notificationService;
    private readonly IEmailSender _emailSender;
    private readonly IUnitOfWork _unitOfWork;

    public OrderRequestService(
        IRepository<OrderRequest> repository,
        IRepository<ServicePlan> servicePlanRepository,
        IRepository<PlanPrice> planPriceRepository,
        INotificationService notificationService,
        IEmailSender emailSender,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _servicePlanRepository = servicePlanRepository;
        _planPriceRepository = planPriceRepository;
        _notificationService = notificationService;
        _emailSender = emailSender;
        _unitOfWork = unitOfWork;
    }

    public async Task<OrderRequestDto> CreateAsync(CreateOrderRequestDto dto)
    {
        if (dto.ServicePlanId == Guid.Empty)
            throw new ArgumentException("ServicePlanId không hợp lệ.");

        var plan = await _servicePlanRepository.GetByIdAsync(dto.ServicePlanId)
            ?? throw new KeyNotFoundException("Không tìm thấy gói dịch vụ.");

        if (!plan.IsActive)
            throw new InvalidOperationException("Gói dịch vụ hiện không còn hoạt động.");

        var billingCycle = NormalizeBillingCycle(dto.BillingCycle);
        var prices = await _planPriceRepository.GetAllAsync();
        var hasActivePrice = prices.Any(price =>
            price.ServicePlanId == plan.Id &&
            price.IsActive &&
            string.Equals(price.BillingCycle, billingCycle, StringComparison.OrdinalIgnoreCase));

        if (!hasActivePrice)
            throw new InvalidOperationException("Gói dịch vụ chưa có bảng giá hoạt động cho chu kỳ thanh toán đã chọn.");

        var entity = new OrderRequest
        {
            CustomerName = dto.CustomerName.Trim(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            CompanyName = NormalizeOptional(dto.CompanyName),
            BillingCycle = billingCycle,
            Note = NormalizeOptional(dto.Note),
            ServicePlanId = plan.Id,
            Status = OrderStatus.New
        };
        entity.ReferenceCode = ReferenceCodeGenerator.Create("ORD", entity.CreatedAt);

        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        await _notificationService.CreateForRolesAsync(
            new[] { AppRoles.Admin, AppRoles.Editor },
            "Yêu cầu dịch vụ mới",
            $"[{entity.ReferenceCode}] {entity.CustomerName} vừa đăng ký {plan.Name} ({billingCycle}).",
            "Order",
            "/admin/orders");

        return Map(entity, plan.Name);
    }

    public async Task<PagedResultDto<OrderRequestDto>> GetForManagementAsync(
        string? search,
        string? status,
        string? sort,
        int page,
        int pageSize)
    {
        ValidatePaging(page, pageSize);
        var orders = (await _repository.GetAllAsync()).AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            orders = orders.Where(order =>
                order.CustomerName.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                order.Email.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                order.PhoneNumber.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                (order.CompanyName?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false) ||
                ReferenceCodeGenerator.GetDisplayCode("ORD", order.ReferenceCode, order.CreatedAt, order.Id)
                    .Contains(keyword, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var parsedStatus = ParseStatus(status);
            orders = orders.Where(order => order.Status == parsedStatus);
        }

        orders = NormalizeSort(sort) switch
        {
            "oldest" => orders.OrderBy(order => order.CreatedAt),
            "status" => orders.OrderBy(order => order.Status).ThenByDescending(order => order.CreatedAt),
            _ => orders.OrderByDescending(order => order.CreatedAt)
        };

        var materialized = orders.ToList();
        var plans = (await _servicePlanRepository.GetAllAsync())
            .ToDictionary(plan => plan.Id, plan => plan.Name);
        var totalItems = materialized.Count;
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

        return new PagedResultDto<OrderRequestDto>
        {
            Items = materialized
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(order => Map(order, plans.GetValueOrDefault(order.ServicePlanId, "Gói dịch vụ không còn tồn tại")))
                .ToArray(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }

    public async Task<OrderRequestDto?> GetByIdAsync(Guid id)
    {
        var order = await _repository.GetByIdAsync(id);
        if (order == null)
            return null;

        var plan = await _servicePlanRepository.GetByIdAsync(order.ServicePlanId);
        return Map(order, plan?.Name ?? "Gói dịch vụ không còn tồn tại");
    }

    public async Task<OrderRequestDto?> UpdateStatusAsync(Guid id, UpdateOrderStatusDto dto)
    {
        var order = await _repository.GetByIdAsync(id);
        if (order == null)
            return null;

        var newStatus = ParseStatus(dto.Status);
        EnsureValidTransition(order.Status, newStatus);
        var statusChanged = order.Status != newStatus;

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        _repository.Update(order);
        await _unitOfWork.SaveChangesAsync();

        var plan = await _servicePlanRepository.GetByIdAsync(order.ServicePlanId);
        var planName = plan?.Name ?? "Gói dịch vụ";

        if (statusChanged)
        {
            var statusMessage = BuildOrderStatusMessage(planName, newStatus);

            await _notificationService.CreateForUserByEmailAsync(
                order.Email,
                "Cập nhật yêu cầu dịch vụ",
                statusMessage,
                "Order",
                "/order");

            await _emailSender.SendAsync(
                order.Email,
                "[NovaCloud] Cập nhật trạng thái yêu cầu dịch vụ",
                EmailTemplates.OrderStatus(
                    order.CustomerName,
                    ReferenceCodeGenerator.GetDisplayCode("ORD", order.ReferenceCode, order.CreatedAt, order.Id),
                    planName,
                    order.BillingCycle,
                    newStatus.ToString(),
                    statusMessage));
        }

        return Map(order, planName);
    }

    private static string BuildOrderStatusMessage(string planName, OrderStatus status) =>
        status switch
        {
            OrderStatus.Processing =>
                $"Yêu cầu {planName} của bạn đang được xử lý.",
            OrderStatus.Completed =>
                $"Yêu cầu {planName} của bạn đã được chấp nhận và hoàn tất xử lý.",
            OrderStatus.Rejected =>
                $"Yêu cầu {planName} của bạn đã bị từ chối. Vui lòng liên hệ NovaCloud nếu cần hỗ trợ.",
            _ =>
                $"Yêu cầu {planName} của bạn đã được cập nhật."
        };

    private static void EnsureValidTransition(OrderStatus current, OrderStatus next)
    {
        if (current == next)
            return;

        var valid = current switch
        {
            OrderStatus.New => next is OrderStatus.Processing or OrderStatus.Rejected,
            OrderStatus.Processing => next is OrderStatus.Completed or OrderStatus.Rejected,
            OrderStatus.Completed => false,
            OrderStatus.Rejected => false,
            _ => false
        };

        if (!valid)
        {
            throw new InvalidOperationException(
                $"Không thể chuyển trạng thái đơn hàng từ {current} sang {next}. " +
                "Luồng hợp lệ: New → Processing → Completed hoặc Rejected.");
        }
    }

    private static OrderStatus ParseStatus(string status)
    {
        if (Enum.TryParse<OrderStatus>(status?.Trim(), true, out var parsed) &&
            Enum.IsDefined(typeof(OrderStatus), parsed))
            return parsed;

        throw new ArgumentException("Trạng thái không hợp lệ. Dùng New, Processing, Completed hoặc Rejected.");
    }

    private static string NormalizeBillingCycle(string billingCycle)
    {
        var match = AllowedBillingCycles.FirstOrDefault(cycle =>
            string.Equals(cycle, billingCycle?.Trim(), StringComparison.OrdinalIgnoreCase));

        return match ?? throw new ArgumentException("BillingCycle không hợp lệ. Dùng Monthly hoặc Yearly.");
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

    private static void ValidatePaging(int page, int pageSize)
    {
        if (page < 1)
            throw new ArgumentException("Page phải lớn hơn hoặc bằng 1.");
        if (pageSize < 1 || pageSize > MaxPageSize)
            throw new ArgumentException($"PageSize phải nằm trong khoảng từ 1 đến {MaxPageSize}.");
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static OrderRequestDto Map(OrderRequest order, string servicePlanName) => new()
    {
        Id = order.Id,
        ReferenceCode = ReferenceCodeGenerator.GetDisplayCode("ORD", order.ReferenceCode, order.CreatedAt, order.Id),
        CustomerName = order.CustomerName,
        Email = order.Email,
        PhoneNumber = order.PhoneNumber,
        CompanyName = order.CompanyName,
        BillingCycle = order.BillingCycle,
        Note = order.Note,
        Status = order.Status.ToString(),
        ServicePlanId = order.ServicePlanId,
        ServicePlanName = servicePlanName,
        CreatedAt = order.CreatedAt,
        UpdatedAt = order.UpdatedAt
    };
}
