using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.NewsArticles;

namespace CloudService.Application.Interfaces.Services;

public interface INewsArticleService
{
    Task<PagedResultDto<NewsArticleDto>> GetPublishedAsync(
        string? search,
        string? category,
        string? sort,
        int page,
        int pageSize);

    Task<NewsArticleDto?> GetPublishedByIdAsync(Guid id);

    Task<NewsArticleDto?> GetPublishedBySlugAsync(string slug);

    Task<IReadOnlyCollection<string>> GetPublishedCategoriesAsync();

    Task<PagedResultDto<NewsArticleDto>> GetForManagementAsync(
        string? search,
        string? category,
        bool? isPublished,
        string? sort,
        int page,
        int pageSize);

    Task<NewsArticleDto?> GetByIdForManagementAsync(Guid id);

    Task<NewsArticleDto> CreateAsync(CreateNewsArticleDto dto);

    Task<bool> UpdateAsync(Guid id, UpdateNewsArticleDto dto);

    Task<bool> DeleteAsync(Guid id);
}
