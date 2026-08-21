using System.Text.RegularExpressions;
using CloudService.Application.Utilities;

namespace CloudService.Tests.Utilities;

public class ReferenceCodeGeneratorTests
{
    [Fact]
    public void Create_UsesNormalizedPrefixDateAndSixCharacterSuffix()
    {
        var date = new DateTime(2026, 8, 21, 10, 0, 0, DateTimeKind.Utc);

        var code = ReferenceCodeGenerator.Create(" con ", date);

        Assert.Matches(new Regex("^CON-20260821-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$"), code);
    }

    [Fact]
    public void GetDisplayCode_WhenStoredCodeMissing_ReturnsStableFallbackFromGuid()
    {
        var id = Guid.Parse("abcdef12-3456-7890-abcd-ef1234567890");
        var date = new DateTime(2026, 8, 21, 0, 0, 0, DateTimeKind.Utc);

        var first = ReferenceCodeGenerator.GetDisplayCode("ord", null, date, id);
        var second = ReferenceCodeGenerator.GetDisplayCode("ORD", " ", date, id);

        Assert.Equal("ORD-20260821-ABCDEF", first);
        Assert.Equal(first, second);
    }

    [Fact]
    public void Normalize_TrimsAndUppercasesValue()
    {
        var result = ReferenceCodeGenerator.Normalize(" con-20260821-abC234 ");

        Assert.Equal("CON-20260821-ABC234", result);
    }
}
