namespace CloudService.Application.Interfaces.QrCodes;

public sealed class QrCodeResult
{
    public byte[] Data { get; init; } = Array.Empty<byte>();
    public string ContentType { get; init; } = string.Empty;
    public string FileExtension { get; init; } = string.Empty;
}
