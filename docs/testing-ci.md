# Testing and CI

## 1. Test Stack

- xUnit 2.5.3
- Moq 4.20.72
- Microsoft.NET.Test.Sdk
- Coverlet Collector

Current suite: **71 `[Fact]` tests**.

## 2. Test Files

```text
Application/
├── AffiliateApplicationServiceTests.cs
├── AuthServiceTests.cs
├── ContactRequestServiceTests.cs
├── CustomerAccountServiceTests.cs
├── NotificationServiceTests.cs
├── OrderRequestServiceTests.cs
├── PlanPriceServiceTests.cs
├── PromotionServiceTests.cs
├── RequestTrackingServiceTests.cs
├── ServiceCategoryServiceTests.cs
└── UserManagementServiceTests.cs

Utilities/
└── ReferenceCodeGeneratorTests.cs
```

These are mainly Application/utility unit tests and use Moq so they do not require a real SMTP server or production database.

## 3. Run Tests

```powershell
dotnet test CloudService.slnx
```

Expected final checkpoint:

```text
total: 71
failed: 0
succeeded: 71
```

## 4. Coverage

```powershell
dotnet test CloudService.slnx --collect:"XPlat Code Coverage"
```

Coverage output is generated under:

```text
backend/CloudService.Tests/TestResults/.../coverage.cobertura.xml
```

`TestResults` should not be committed.

## 5. GitHub Actions

Workflow:

```text
.github/workflows/ci.yml
```

### Backend - Build & Test

- setup .NET 8
- restore API/tests
- Release build
- run tests with XPlat coverage
- upload test result / coverage artifact

### Frontend - Build

- setup Node.js 22
- `npm ci`
- `npm run build`

### Docker - Validate & Build

Runs after backend/frontend:

- `docker compose config`
- `docker compose build api`

This prevents a pull request from being considered healthy while the Docker configuration/image is broken.
