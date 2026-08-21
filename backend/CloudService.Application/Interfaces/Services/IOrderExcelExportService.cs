namespace CloudService.Application.Interfaces.Services;

public interface IOrderExcelExportService
{
    Task<byte[]> ExportAsync(string? search, string? status, string? sort);
}
