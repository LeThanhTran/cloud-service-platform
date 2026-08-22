using CloudService.Application.DTOs.NewsArticles;
using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Domain.Entities;
using Moq;

namespace CloudService.Tests.Application;

public class NewsArticleServiceTests
{
    private readonly Mock<IRepository<NewsArticle>> _repository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    public NewsArticleServiceTests()
    {
        _repository
            .Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(Array.Empty<NewsArticle>());

        _unitOfWork
            .Setup(unitOfWork => unitOfWork.SaveChangesAsync())
            .ReturnsAsync(1);
    }

    [Fact]
    public async Task GetPublishedAsync_ReturnsOnlyPublishedMatchingArticles()
    {
        _repository.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            Article("Cloud VPS an toàn", "cloud-vps-an-toan", "Kiến thức", true,
                summary: "Hướng dẫn bảo mật cloud."),
            Article("Cloud VPS nội bộ", "cloud-vps-noi-bo", "Kiến thức", false,
                summary: "Bản nháp không được xuất hiện."),
            Article("Khuyến mãi hosting", "khuyen-mai-hosting", "Khuyến mãi", true,
                summary: "Ưu đãi hosting tháng này.")
        });

        var result = await CreateService().GetPublishedAsync(
            "cloud",
            "Kiến thức",
            "latest",
            page: 1,
            pageSize: 6);

        var item = Assert.Single(result.Items);
        Assert.Equal("cloud-vps-an-toan", item.Slug);
        Assert.True(item.IsPublished);
        Assert.Equal(1, result.TotalItems);
    }

    [Fact]
    public async Task GetPublishedAsync_LatestSort_OrdersByPublishedDateDescending()
    {
        var older = Article("Older", "older", "Tin tức", true);
        older.PublishedAt = DateTime.UtcNow.AddDays(-2);

        var newer = Article("Newer", "newer", "Tin tức", true);
        newer.PublishedAt = DateTime.UtcNow.AddHours(-1);

        _repository.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { older, newer });

        var result = await CreateService().GetPublishedAsync(
            null,
            null,
            "latest",
            page: 1,
            pageSize: 10);

        Assert.Equal(new[] { "newer", "older" }, result.Items.Select(item => item.Slug));
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(1, 0)]
    [InlineData(1, 51)]
    public async Task GetPublishedAsync_InvalidPaging_IsRejected(int page, int pageSize)
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            CreateService().GetPublishedAsync(null, null, "latest", page, pageSize));
    }

    [Fact]
    public async Task GetPublishedAsync_InvalidSort_IsRejected()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            CreateService().GetPublishedAsync(null, null, "unknown-sort", 1, 10));
    }

    [Fact]
    public async Task GetPublishedBySlugAsync_NormalizesSlugAndIgnoresDrafts()
    {
        _repository.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            Article("Published", "cloud-security", "Kiến thức", true),
            Article("Draft", "draft-news", "Kiến thức", false)
        });

        var published = await CreateService().GetPublishedBySlugAsync("  CLOUD-SECURITY  ");
        var draft = await CreateService().GetPublishedBySlugAsync("draft-news");

        Assert.NotNull(published);
        Assert.Equal("cloud-security", published!.Slug);
        Assert.Null(draft);
    }

    [Fact]
    public async Task GetPublishedCategoriesAsync_ReturnsDistinctTrimmedPublishedCategories()
    {
        _repository.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            Article("A", "a", " Cloud ", true),
            Article("B", "b", "cloud", true),
            Article("C", "c", "Tin tức", true),
            Article("D", "d", "Nội bộ", false)
        });

        var result = await CreateService().GetPublishedCategoriesAsync();

        Assert.Equal(2, result.Count);
        Assert.Contains(result, category => string.Equals(category, "Cloud", StringComparison.OrdinalIgnoreCase));
        Assert.Contains("Tin tức", result);
        Assert.DoesNotContain("Nội bộ", result);
    }

    [Fact]
    public async Task GetForManagementAsync_FiltersByPublishStatus()
    {
        _repository.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            Article("Published", "published", "Tin tức", true),
            Article("Draft", "draft", "Tin tức", false)
        });

        var result = await CreateService().GetForManagementAsync(
            null,
            null,
            isPublished: false,
            sort: "updated-desc",
            page: 1,
            pageSize: 10);

        var item = Assert.Single(result.Items);
        Assert.Equal("draft", item.Slug);
        Assert.False(item.IsPublished);
    }

    [Fact]
    public async Task CreateAsync_NormalizesFieldsAndSetsPublishedAt()
    {
        NewsArticle? captured = null;
        _repository
            .Setup(repository => repository.AddAsync(It.IsAny<NewsArticle>()))
            .Callback<NewsArticle>(article => captured = article)
            .Returns(Task.CompletedTask);

        var result = await CreateService().CreateAsync(new CreateNewsArticleDto
        {
            Title = "  Hướng dẫn Cloud VPS  ",
            Slug = "  HUONG-DAN-CLOUD-VPS  ",
            Summary = "  Tóm tắt bài viết  ",
            Content = "  Nội dung chi tiết  ",
            Category = "  Kiến thức  ",
            ThumbnailUrl = "  https://example.com/cloud.webp  ",
            IsPublished = true
        });

        Assert.NotNull(captured);
        Assert.Equal("Hướng dẫn Cloud VPS", captured!.Title);
        Assert.Equal("huong-dan-cloud-vps", captured.Slug);
        Assert.Equal("Tóm tắt bài viết", captured.Summary);
        Assert.Equal("Nội dung chi tiết", captured.Content);
        Assert.Equal("Kiến thức", captured.Category);
        Assert.Equal("https://example.com/cloud.webp", captured.ThumbnailUrl);
        Assert.NotNull(captured.PublishedAt);
        Assert.Equal("huong-dan-cloud-vps", result.Slug);
        _repository.Verify(repository => repository.AddAsync(It.IsAny<NewsArticle>()), Times.Once);
        _unitOfWork.Verify(unitOfWork => unitOfWork.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateSlug_IsRejectedCaseInsensitively()
    {
        _repository.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[]
        {
            Article("Existing", "tin-cloud", "Tin tức", true)
        });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateService().CreateAsync(new CreateNewsArticleDto
            {
                Title = "Bài mới",
                Slug = "  TIN-CLOUD  ",
                Summary = "Tóm tắt",
                Content = "Nội dung",
                Category = "Tin tức",
                IsPublished = true
            }));

        _repository.Verify(repository => repository.AddAsync(It.IsAny<NewsArticle>()), Times.Never);
        _unitOfWork.Verify(unitOfWork => unitOfWork.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_DraftToPublished_UpdatesContentAndPublishedAt()
    {
        var article = Article("Old title", "old-slug", "Tin tức", false);
        _repository.Setup(repository => repository.GetByIdAsync(article.Id)).ReturnsAsync(article);
        _repository.Setup(repository => repository.GetAllAsync()).ReturnsAsync(new[] { article });

        var result = await CreateService().UpdateAsync(article.Id, new UpdateNewsArticleDto
        {
            Title = "  New title  ",
            Slug = "  NEW-SLUG  ",
            Summary = "  New summary  ",
            Content = "  New content  ",
            Category = "  Kiến thức  ",
            IsPublished = true
        });

        Assert.True(result);
        Assert.Equal("New title", article.Title);
        Assert.Equal("new-slug", article.Slug);
        Assert.Equal("New summary", article.Summary);
        Assert.Equal("New content", article.Content);
        Assert.Equal("Kiến thức", article.Category);
        Assert.True(article.IsPublished);
        Assert.NotNull(article.PublishedAt);
        Assert.NotNull(article.UpdatedAt);
        _repository.Verify(repository => repository.Update(article), Times.Once);
        _unitOfWork.Verify(unitOfWork => unitOfWork.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_DuplicateSlugFromAnotherArticle_IsRejected()
    {
        var article = Article("Current", "current", "Tin tức", true);
        var other = Article("Other", "duplicate", "Tin tức", true);

        _repository.Setup(repository => repository.GetByIdAsync(article.Id)).ReturnsAsync(article);
        _repository.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { article, other });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateService().UpdateAsync(article.Id, new UpdateNewsArticleDto
            {
                Title = "Current",
                Slug = "DUPLICATE",
                Summary = "Summary",
                Content = "Content",
                Category = "Tin tức",
                IsPublished = true
            }));

        _repository.Verify(repository => repository.Update(It.IsAny<NewsArticle>()), Times.Never);
        _unitOfWork.Verify(unitOfWork => unitOfWork.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_MissingArticle_ReturnsFalseWithoutSaving()
    {
        var id = Guid.NewGuid();
        _repository.Setup(repository => repository.GetByIdAsync(id))
            .ReturnsAsync((NewsArticle?)null);

        var result = await CreateService().UpdateAsync(id, new UpdateNewsArticleDto
        {
            Title = "Missing",
            Slug = "missing",
            Summary = "Summary",
            Content = "Content",
            Category = "Tin tức",
            IsPublished = false
        });

        Assert.False(result);
        _repository.Verify(repository => repository.Update(It.IsAny<NewsArticle>()), Times.Never);
        _unitOfWork.Verify(unitOfWork => unitOfWork.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ExistingArticle_DeletesAndSaves()
    {
        var article = Article("Delete", "delete", "Tin tức", false);
        _repository.Setup(repository => repository.GetByIdAsync(article.Id)).ReturnsAsync(article);

        var result = await CreateService().DeleteAsync(article.Id);

        Assert.True(result);
        _repository.Verify(repository => repository.Delete(article), Times.Once);
        _unitOfWork.Verify(unitOfWork => unitOfWork.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_MissingArticle_ReturnsFalseWithoutSaving()
    {
        var id = Guid.NewGuid();
        _repository.Setup(repository => repository.GetByIdAsync(id))
            .ReturnsAsync((NewsArticle?)null);

        var result = await CreateService().DeleteAsync(id);

        Assert.False(result);
        _repository.Verify(repository => repository.Delete(It.IsAny<NewsArticle>()), Times.Never);
        _unitOfWork.Verify(unitOfWork => unitOfWork.SaveChangesAsync(), Times.Never);
    }

    private NewsArticleService CreateService() => new(
        _repository.Object,
        _unitOfWork.Object);

    private static NewsArticle Article(
        string title,
        string slug,
        string category,
        bool isPublished,
        string summary = "Summary")
    {
        return new NewsArticle
        {
            Title = title,
            Slug = slug,
            Summary = summary,
            Content = "Content",
            Category = category,
            IsPublished = isPublished,
            PublishedAt = isPublished ? DateTime.UtcNow : null
        };
    }
}
