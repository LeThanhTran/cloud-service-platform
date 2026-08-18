namespace CloudService.Domain.Constants;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Editor = "Editor";
    public const string User = "User";

    // Dùng trực tiếp cho [Authorize(Roles = ...)] ở các API mà
    // cả Admin và Editor đều được phép truy cập.
    public const string AdminOrEditor = Admin + "," + Editor;

    public static bool TryNormalize(string? role, out string normalizedRole)
    {
        if (string.Equals(role, Admin, StringComparison.OrdinalIgnoreCase))
        {
            normalizedRole = Admin;
            return true;
        }

        if (string.Equals(role, Editor, StringComparison.OrdinalIgnoreCase))
        {
            normalizedRole = Editor;
            return true;
        }

        if (string.Equals(role, User, StringComparison.OrdinalIgnoreCase))
        {
            normalizedRole = User;
            return true;
        }

        normalizedRole = string.Empty;
        return false;
    }
}
