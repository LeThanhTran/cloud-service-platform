# NovaCloud Application Tests

## Test Stack

- xUnit
- Moq
- Coverlet Collector

## Current Test Suite

Current checkpoint: **71 tests**.

Test groups:

- `ServiceCategoryServiceTests`
- `OrderRequestServiceTests`
- `ContactRequestServiceTests`
- `AffiliateApplicationServiceTests`
- `RequestTrackingServiceTests`
- `CustomerAccountServiceTests`
- `UserManagementServiceTests`
- `AuthServiceTests`
- `NotificationServiceTests`
- `PlanPriceServiceTests`
- `PromotionServiceTests`
- `ReferenceCodeGeneratorTests`

The tests focus mainly on Application/utility logic and use mocks so they do not require production SQL Server, Gmail SMTP or live notification delivery.

## Run Tests

```powershell
dotnet restore CloudService.slnx
dotnet test CloudService.slnx
```

Expected result:

```text
total: 71
failed: 0
succeeded: 71
```

## Coverage

```powershell
dotnet test CloudService.slnx --collect:"XPlat Code Coverage"
```

Coverage output:

```text
backend/CloudService.Tests/TestResults/.../coverage.cobertura.xml
```

`TestResults` is generated output and should not be committed.
