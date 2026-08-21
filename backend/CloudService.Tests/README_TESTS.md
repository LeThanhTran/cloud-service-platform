# NovaCloud Application Tests

Checkpoint: `feature/application-tests`

## Phạm vi
- xUnit + Moq
- 29 test ở tầng Application/Utility
- Không cần database thật
- Không gọi Gmail thật
- Không gọi Notification thật

## Nhóm test
- `ServiceCategoryServiceTests`: CRUD/mapping
- `OrderRequestServiceTests`: tạo đơn, validation, workflow trạng thái, notification/email
- `ContactRequestServiceTests`: tạo liên hệ, workflow, pagination 10 dòng/trang
- `AffiliateApplicationServiceTests`: tạo hồ sơ + workflow
- `RequestTrackingServiceTests`: tra cứu code + email và chống tra cứu sai email
- `ReferenceCodeGeneratorTests`: format/reference-code fallback/normalize

## Chạy test
```powershell
dotnet restore CloudService.slnx
dotnet test CloudService.slnx
```

## Coverage
Project đã có `coverlet.collector`, có thể chạy:
```powershell
dotnet test CloudService.slnx --collect:"XPlat Code Coverage"
```
Kết quả coverage sẽ nằm trong `backend/CloudService.Tests/TestResults/.../coverage.cobertura.xml`.
