using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.NewsArticles;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces.Services;

public class NewsArticleService : INewsArticleService
{
    private const int MaxPageSize = 50;

    private readonly IRepository<NewsArticle> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public NewsArticleService(
        IRepository<NewsArticle> repository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResultDto<NewsArticleDto>> GetPublishedAsync(
        string? search,
        string? category,
        string? sort,
        int page,
        int pageSize)
    {
        ValidatePaging(page, pageSize);

        var articles = await _repository.GetAllAsync();
        var query = articles.Where(article => article.IsPublished);

        query = ApplyFilters(query, search, category);
        query = ApplySorting(query, sort, management: false);

        return ToPagedResult(query, page, pageSize);
    }

    public async Task<NewsArticleDto?> GetPublishedByIdAsync(Guid id)
    {
        var article = await _repository.GetByIdAsync(id);

        if (article == null || !article.IsPublished)
            return null;

        return Map(article);
    }

    public async Task<NewsArticleDto?> GetPublishedBySlugAsync(string slug)
    {
        var normalizedSlug = NormalizeSlug(slug);
        var articles = await _repository.GetAllAsync();

        var article = articles.FirstOrDefault(item =>
            item.IsPublished &&
            string.Equals(item.Slug, normalizedSlug, StringComparison.OrdinalIgnoreCase));

        return article == null ? null : Map(article);
    }

    public async Task<IReadOnlyCollection<string>> GetPublishedCategoriesAsync()
    {
        var articles = await _repository.GetAllAsync();

        return articles
            .Where(article => article.IsPublished)
            .Select(article => article.Category.Trim())
            .Where(category => !string.IsNullOrWhiteSpace(category))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(category => category)
            .ToArray();
    }

    public async Task<PagedResultDto<NewsArticleDto>> GetForManagementAsync(
        string? search,
        string? category,
        bool? isPublished,
        string? sort,
        int page,
        int pageSize)
    {
        ValidatePaging(page, pageSize);

        var articles = await _repository.GetAllAsync();
        var query = ApplyFilters(articles, search, category);

        if (isPublished.HasValue)
        {
            query = query.Where(article => article.IsPublished == isPublished.Value);
        }

        query = ApplySorting(query, sort, management: true);

        return ToPagedResult(query, page, pageSize);
    }

    public async Task<NewsArticleDto?> GetByIdForManagementAsync(Guid id)
    {
        var article = await _repository.GetByIdAsync(id);
        return article == null ? null : Map(article);
    }

    public async Task<NewsArticleDto> CreateAsync(CreateNewsArticleDto dto)
    {
        var slug = NormalizeSlug(dto.Slug);
        await EnsureSlugIsUniqueAsync(slug);

        var entity = new NewsArticle
        {
            Title = dto.Title.Trim(),
            Slug = slug,
            Summary = dto.Summary.Trim(),
            Content = dto.Content.Trim(),
            ThumbnailUrl = NormalizeOptional(dto.ThumbnailUrl),
            Category = dto.Category.Trim(),
            IsPublished = dto.IsPublished,
            PublishedAt = dto.IsPublished ? DateTime.UtcNow : null
        };

        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        return Map(entity);
    }

    public async Task<bool> UpdateAsync(Guid id, UpdateNewsArticleDto dto)
    {
        var entity = await _repository.GetByIdAsync(id);

        if (entity == null)
            return false;

        var slug = NormalizeSlug(dto.Slug);
        await EnsureSlugIsUniqueAsync(slug, id);

        var wasPublished = entity.IsPublished;

        entity.Title = dto.Title.Trim();
        entity.Slug = slug;
        entity.Summary = dto.Summary.Trim();
        entity.Content = dto.Content.Trim();
        entity.ThumbnailUrl = NormalizeOptional(dto.ThumbnailUrl);
        entity.Category = dto.Category.Trim();
        entity.IsPublished = dto.IsPublished;
        entity.UpdatedAt = DateTime.UtcNow;

        if (dto.IsPublished && !wasPublished)
        {
            entity.PublishedAt = DateTime.UtcNow;
        }
        else if (!dto.IsPublished)
        {
            entity.PublishedAt = null;
        }

        _repository.Update(entity);

        return await _unitOfWork.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);

        if (entity == null)
            return false;

        _repository.Delete(entity);

        return await _unitOfWork.SaveChangesAsync() > 0;
    }

    private async Task EnsureSlugIsUniqueAsync(
        string slug,
        Guid? ignoredArticleId = null)
    {
        var articles = await _repository.GetAllAsync();

        var duplicateExists = articles.Any(article =>
            (!ignoredArticleId.HasValue || article.Id != ignoredArticleId.Value) &&
            string.Equals(article.Slug, slug, StringComparison.OrdinalIgnoreCase));

        if (duplicateExists)
        {
            throw new InvalidOperationException("Slug bài viết đã tồn tại.");
        }
    }

    private static IEnumerable<NewsArticle> ApplyFilters(
        IEnumerable<NewsArticle> source,
        string? search,
        string? category)
    {
        var query = source;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();

            query = query.Where(article =>
                article.Title.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                article.Summary.Contains(keyword, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            var requestedCategory = category.Trim();

            query = query.Where(article =>
                string.Equals(
                    article.Category,
                    requestedCategory,
                    StringComparison.OrdinalIgnoreCase));
        }

        return query;
    }

    private static IEnumerable<NewsArticle> ApplySorting(
        IEnumerable<NewsArticle> source,
        string? sort,
        bool management)
    {
        var normalizedSort = string.IsNullOrWhiteSpace(sort)
            ? (management ? "updated-desc" : "latest")
            : sort.Trim().ToLowerInvariant();

        return normalizedSort switch
        {
            "latest" => source
                .OrderByDescending(article => article.PublishedAt ?? article.CreatedAt)
                .ThenByDescending(article => article.CreatedAt),

            "oldest" => source
                .OrderBy(article => article.PublishedAt ?? article.CreatedAt)
                .ThenBy(article => article.CreatedAt),

            "title-asc" => source.OrderBy(article => article.Title),

            "title-desc" => source.OrderByDescending(article => article.Title),

            "updated-desc" when management => source
                .OrderByDescending(article => article.UpdatedAt ?? article.CreatedAt)
                .ThenByDescending(article => article.CreatedAt),

            _ => throw new ArgumentException(
                "Sort không hợp lệ. Dùng latest, oldest, title-asc, title-desc" +
                (management ? " hoặc updated-desc." : "."))
        };
    }

    private static PagedResultDto<NewsArticleDto> ToPagedResult(
        IEnumerable<NewsArticle> query,
        int page,
        int pageSize)
    {
        var materialized = query.ToList();
        var totalItems = materialized.Count;
        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = materialized
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(Map)
            .ToArray();

        return new PagedResultDto<NewsArticleDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }

    private static NewsArticleDto Map(NewsArticle article)
    {
        return new NewsArticleDto
        {
            Id = article.Id,
            Title = article.Title,
            Slug = article.Slug,
            Summary = article.Summary,
            Content = article.Content,
            ThumbnailUrl = article.ThumbnailUrl,
            Category = article.Category,
            IsPublished = article.IsPublished,
            PublishedAt = article.PublishedAt,
            CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt
        };
    }

    private static void ValidatePaging(int page, int pageSize)
    {
        if (page < 1)
            throw new ArgumentException("Page phải lớn hơn hoặc bằng 1.");

        if (pageSize < 1 || pageSize > MaxPageSize)
        {
            throw new ArgumentException(
                $"PageSize phải nằm trong khoảng từ 1 đến {MaxPageSize}.");
        }
    }

    private static string NormalizeSlug(string slug)
    {
        return slug.Trim().ToLowerInvariant();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
