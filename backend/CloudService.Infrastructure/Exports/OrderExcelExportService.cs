using CloudService.Application.Interfaces.Repositories;
using CloudService.Application.Interfaces.Services;
using CloudService.Application.Utilities;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Xml;

namespace CloudService.Infrastructure.Exports;

public class OrderExcelExportService : IOrderExcelExportService
{
    private readonly IRepository<OrderRequest> _orderRepository;
    private readonly IRepository<ServicePlan> _servicePlanRepository;

    public OrderExcelExportService(
        IRepository<OrderRequest> orderRepository,
        IRepository<ServicePlan> servicePlanRepository)
    {
        _orderRepository = orderRepository;
        _servicePlanRepository = servicePlanRepository;
    }

    public async Task<byte[]> ExportAsync(string? search, string? status, string? sort)
    {
        var orders = (await _orderRepository.GetAllAsync()).AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            orders = orders.Where(order =>
                order.CustomerName.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                order.Email.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                order.PhoneNumber.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                (order.CompanyName?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false) ||
                ReferenceCodeGenerator.GetDisplayCode("ORD", order.ReferenceCode, order.CreatedAt, order.Id)
                    .Contains(keyword, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var parsedStatus = ParseStatus(status);
            orders = orders.Where(order => order.Status == parsedStatus);
        }

        orders = NormalizeSort(sort) switch
        {
            "oldest" => orders.OrderBy(order => order.CreatedAt),
            "status" => orders.OrderBy(order => order.Status).ThenByDescending(order => order.CreatedAt),
            _ => orders.OrderByDescending(order => order.CreatedAt)
        };

        var materialized = orders.ToList();
        var plans = (await _servicePlanRepository.GetAllAsync())
            .ToDictionary(plan => plan.Id, plan => plan.Name);

        return BuildWorkbook(materialized, plans);
    }

    private static byte[] BuildWorkbook(
        IReadOnlyList<OrderRequest> orders,
        IReadOnlyDictionary<Guid, string> plans)
    {
        using var output = new MemoryStream();

        using (var archive = new ZipArchive(output, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteTextEntry(archive, "[Content_Types].xml", ContentTypesXml);
            WriteTextEntry(archive, "_rels/.rels", RootRelationshipsXml);
            WriteTextEntry(archive, "xl/workbook.xml", WorkbookXml);
            WriteTextEntry(archive, "xl/_rels/workbook.xml.rels", WorkbookRelationshipsXml);
            WriteTextEntry(archive, "xl/styles.xml", StylesXml);

            var worksheetEntry = archive.CreateEntry("xl/worksheets/sheet1.xml", CompressionLevel.Fastest);
            using var worksheetStream = worksheetEntry.Open();
            WriteWorksheet(worksheetStream, orders, plans);
        }

        return output.ToArray();
    }

    private static void WriteWorksheet(
        Stream stream,
        IReadOnlyList<OrderRequest> orders,
        IReadOnlyDictionary<Guid, string> plans)
    {
        var settings = new XmlWriterSettings
        {
            Encoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false),
            Indent = false,
            CloseOutput = false
        };

        using var writer = XmlWriter.Create(stream, settings);

        writer.WriteStartDocument();
        writer.WriteStartElement("worksheet", SpreadsheetNamespace);

        writer.WriteStartElement("sheetViews", SpreadsheetNamespace);
        writer.WriteStartElement("sheetView", SpreadsheetNamespace);
        writer.WriteAttributeString("workbookViewId", "0");
        writer.WriteStartElement("pane", SpreadsheetNamespace);
        writer.WriteAttributeString("ySplit", "1");
        writer.WriteAttributeString("topLeftCell", "A2");
        writer.WriteAttributeString("activePane", "bottomLeft");
        writer.WriteAttributeString("state", "frozen");
        writer.WriteEndElement();
        writer.WriteEndElement();
        writer.WriteEndElement();

        writer.WriteStartElement("cols", SpreadsheetNamespace);
        WriteColumn(writer, 1, 1, 6);
        WriteColumn(writer, 2, 2, 22);
        WriteColumn(writer, 3, 3, 24);
        WriteColumn(writer, 4, 4, 30);
        WriteColumn(writer, 5, 5, 17);
        WriteColumn(writer, 6, 6, 22);
        WriteColumn(writer, 7, 7, 26);
        WriteColumn(writer, 8, 9, 16);
        WriteColumn(writer, 10, 11, 20);
        WriteColumn(writer, 12, 12, 42);
        writer.WriteEndElement();

        writer.WriteStartElement("sheetData", SpreadsheetNamespace);

        var headers = new[]
        {
            "STT",
            "Mã yêu cầu",
            "Khách hàng",
            "Email",
            "Điện thoại",
            "Công ty",
            "Gói dịch vụ",
            "Chu kỳ",
            "Trạng thái",
            "Ngày gửi",
            "Cập nhật gần nhất",
            "Ghi chú"
        };

        writer.WriteStartElement("row", SpreadsheetNamespace);
        writer.WriteAttributeString("r", "1");
        writer.WriteAttributeString("ht", "24");
        writer.WriteAttributeString("customHeight", "1");

        for (var index = 0; index < headers.Length; index++)
            WriteTextCell(writer, CellReference(index + 1, 1), headers[index], styleIndex: 1);

        writer.WriteEndElement();

        for (var rowIndex = 0; rowIndex < orders.Count; rowIndex++)
        {
            var order = orders[rowIndex];
            var excelRow = rowIndex + 2;
            var planName = plans.GetValueOrDefault(order.ServicePlanId, "Gói dịch vụ không còn tồn tại");
            var referenceCode = ReferenceCodeGenerator.GetDisplayCode(
                "ORD",
                order.ReferenceCode,
                order.CreatedAt,
                order.Id);

            writer.WriteStartElement("row", SpreadsheetNamespace);
            writer.WriteAttributeString("r", excelRow.ToString(CultureInfo.InvariantCulture));

            WriteNumberCell(writer, $"A{excelRow}", rowIndex + 1);
            WriteTextCell(writer, $"B{excelRow}", referenceCode);
            WriteTextCell(writer, $"C{excelRow}", order.CustomerName);
            WriteTextCell(writer, $"D{excelRow}", order.Email);
            WriteTextCell(writer, $"E{excelRow}", order.PhoneNumber);
            WriteTextCell(writer, $"F{excelRow}", order.CompanyName ?? string.Empty);
            WriteTextCell(writer, $"G{excelRow}", planName);
            WriteTextCell(writer, $"H{excelRow}", BillingCycleLabel(order.BillingCycle));
            WriteTextCell(writer, $"I{excelRow}", StatusLabel(order.Status));
            WriteTextCell(writer, $"J{excelRow}", FormatDate(order.CreatedAt));
            WriteTextCell(writer, $"K{excelRow}", order.UpdatedAt.HasValue ? FormatDate(order.UpdatedAt.Value) : string.Empty);
            WriteTextCell(writer, $"L{excelRow}", order.Note ?? string.Empty);

            writer.WriteEndElement();
        }

        writer.WriteEndElement();

        var lastRow = Math.Max(1, orders.Count + 1);
        writer.WriteStartElement("autoFilter", SpreadsheetNamespace);
        writer.WriteAttributeString("ref", $"A1:L{lastRow}");
        writer.WriteEndElement();

        writer.WriteEndElement();
        writer.WriteEndDocument();
    }

    private static void WriteColumn(XmlWriter writer, int min, int max, double width)
    {
        writer.WriteStartElement("col", SpreadsheetNamespace);
        writer.WriteAttributeString("min", min.ToString(CultureInfo.InvariantCulture));
        writer.WriteAttributeString("max", max.ToString(CultureInfo.InvariantCulture));
        writer.WriteAttributeString("width", width.ToString(CultureInfo.InvariantCulture));
        writer.WriteAttributeString("customWidth", "1");
        writer.WriteEndElement();
    }

    private static void WriteTextCell(XmlWriter writer, string reference, string value, int styleIndex = 0)
    {
        writer.WriteStartElement("c", SpreadsheetNamespace);
        writer.WriteAttributeString("r", reference);
        writer.WriteAttributeString("t", "inlineStr");

        if (styleIndex > 0)
            writer.WriteAttributeString("s", styleIndex.ToString(CultureInfo.InvariantCulture));

        writer.WriteStartElement("is", SpreadsheetNamespace);
        writer.WriteStartElement("t", SpreadsheetNamespace);
        writer.WriteAttributeString("xml", "space", XmlNamespace, "preserve");
        writer.WriteString(value);
        writer.WriteEndElement();
        writer.WriteEndElement();
        writer.WriteEndElement();
    }

    private static void WriteNumberCell(XmlWriter writer, string reference, int value)
    {
        writer.WriteStartElement("c", SpreadsheetNamespace);
        writer.WriteAttributeString("r", reference);
        writer.WriteStartElement("v", SpreadsheetNamespace);
        writer.WriteString(value.ToString(CultureInfo.InvariantCulture));
        writer.WriteEndElement();
        writer.WriteEndElement();
    }

    private static string CellReference(int column, int row)
    {
        var letters = string.Empty;
        var current = column;

        while (current > 0)
        {
            current--;
            letters = (char)('A' + current % 26) + letters;
            current /= 26;
        }

        return $"{letters}{row}";
    }

    private static void WriteTextEntry(ZipArchive archive, string path, string content)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Fastest);
        using var stream = entry.Open();
        using var writer = new StreamWriter(
            stream,
            new UTF8Encoding(encoderShouldEmitUTF8Identifier: false),
            bufferSize: 1024,
            leaveOpen: false);

        writer.Write(content);
    }

    private static OrderStatus ParseStatus(string status)
    {
        if (Enum.TryParse<OrderStatus>(status?.Trim(), true, out var parsed) &&
            Enum.IsDefined(typeof(OrderStatus), parsed))
            return parsed;

        throw new ArgumentException(
            "Trạng thái không hợp lệ. Dùng New, Processing, Completed hoặc Rejected.");
    }

    private static string NormalizeSort(string? sort)
    {
        if (string.IsNullOrWhiteSpace(sort))
            return "latest";

        var normalized = sort.Trim().ToLowerInvariant();
        if (normalized is "latest" or "oldest" or "status")
            return normalized;

        throw new ArgumentException("Sort không hợp lệ. Dùng latest, oldest hoặc status.");
    }

    private static string BillingCycleLabel(string billingCycle) =>
        string.Equals(billingCycle, "Yearly", StringComparison.OrdinalIgnoreCase)
            ? "Theo năm"
            : "Theo tháng";

    private static string StatusLabel(OrderStatus status) =>
        status switch
        {
            OrderStatus.New => "Mới",
            OrderStatus.Processing => "Đang xử lý",
            OrderStatus.Completed => "Hoàn tất",
            OrderStatus.Rejected => "Từ chối",
            _ => status.ToString()
        };

    private static string FormatDate(DateTime value)
    {
        var utc = value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);

        return utc
            .AddHours(7)
            .ToString("dd/MM/yyyy HH:mm", CultureInfo.GetCultureInfo("vi-VN"));
    }

    private const string SpreadsheetNamespace =
        "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

    private const string XmlNamespace =
        "http://www.w3.org/XML/1998/namespace";

    private const string ContentTypesXml = """
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>
""";

    private const string RootRelationshipsXml = """
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
                Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
                Target="xl/workbook.xml"/>
</Relationships>
""";

    private const string WorkbookXml = """
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Orders" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>
""";

    private const string WorkbookRelationshipsXml = """
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
                Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
                Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2"
                Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"
                Target="styles.xml"/>
</Relationships>
""";

    private const string StylesXml = """
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <color rgb="FFFFFFFF"/>
      <sz val="11"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0B63F6"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0"
        applyFont="1" applyFill="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>
""";
}
