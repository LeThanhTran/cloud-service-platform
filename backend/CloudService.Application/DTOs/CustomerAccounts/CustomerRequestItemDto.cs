namespace CloudService.Application.DTOs.CustomerAccounts;

public class CustomerRequestItemDto
{
    public Guid Id { get; set; }
    public string ReferenceCode { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
