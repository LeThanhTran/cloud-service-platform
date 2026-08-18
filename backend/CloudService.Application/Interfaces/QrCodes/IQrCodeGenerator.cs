namespace CloudService.Application.Interfaces.QrCodes;

public interface IQrCodeGenerator
{
    QrCodeResult Generate(string content);
}
