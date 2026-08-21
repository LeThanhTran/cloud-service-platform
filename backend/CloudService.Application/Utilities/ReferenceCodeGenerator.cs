using System.Security.Cryptography;

namespace CloudService.Application.Utilities;

public static class ReferenceCodeGenerator
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int RandomLength = 6;

    public static string Create(string prefix, DateTime createdAtUtc)
    {
        var suffix = new char[RandomLength];
        for (var i = 0; i < suffix.Length; i++)
        {
            suffix[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        }

        return $"{NormalizePrefix(prefix)}-{createdAtUtc:yyyyMMdd}-{new string(suffix)}";
    }

    // Dữ liệu được tạo trước migration chưa có ReferenceCode trong DB.
    // API vẫn tạo ra một mã ổn định từ CreatedAt + GUID để hiển thị/tra cứu.
    public static string GetDisplayCode(
        string prefix,
        string? storedReferenceCode,
        DateTime createdAtUtc,
        Guid id)
    {
        if (!string.IsNullOrWhiteSpace(storedReferenceCode))
            return storedReferenceCode.Trim().ToUpperInvariant();

        var suffix = id.ToString("N")[..6].ToUpperInvariant();
        return $"{NormalizePrefix(prefix)}-{createdAtUtc:yyyyMMdd}-{suffix}";
    }

    public static string Normalize(string value) => value.Trim().ToUpperInvariant();

    private static string NormalizePrefix(string prefix) => prefix.Trim().ToUpperInvariant();
}
