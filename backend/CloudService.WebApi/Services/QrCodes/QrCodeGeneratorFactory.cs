using CloudService.Application.Interfaces.QrCodes;

namespace CloudService.WebApi.Services.QrCodes;

public sealed class QrCodeGeneratorFactory : IQrCodeGeneratorFactory
{
    public IQrCodeGenerator Create(QrCodeFormat format)
    {
        return format switch
        {
            QrCodeFormat.Png => new PngQrCodeGenerator(),
            QrCodeFormat.Svg => new SvgQrCodeGenerator(),
            _ => throw new ArgumentOutOfRangeException(
                nameof(format),
                format,
                "Định dạng QR không được hỗ trợ.")
        };
    }
}
