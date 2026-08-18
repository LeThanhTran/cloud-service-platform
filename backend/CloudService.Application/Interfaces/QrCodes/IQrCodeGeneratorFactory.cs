namespace CloudService.Application.Interfaces.QrCodes;

public interface IQrCodeGeneratorFactory
{
    IQrCodeGenerator Create(QrCodeFormat format);
}
