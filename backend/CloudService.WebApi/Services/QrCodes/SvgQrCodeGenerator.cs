using System.Text;
using CloudService.Application.Interfaces.QrCodes;
using QRCoder;

namespace CloudService.WebApi.Services.QrCodes;

public sealed class SvgQrCodeGenerator : IQrCodeGenerator
{
    public QrCodeResult Generate(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Nội dung QR không được để trống.", nameof(content));

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(
            content,
            QRCodeGenerator.ECCLevel.Q);

        using var qrCode = new SvgQRCode(qrCodeData);
        var svg = qrCode.GetGraphic(20);

        return new QrCodeResult
        {
            Data = Encoding.UTF8.GetBytes(svg),
            ContentType = "image/svg+xml",
            FileExtension = "svg"
        };
    }
}
