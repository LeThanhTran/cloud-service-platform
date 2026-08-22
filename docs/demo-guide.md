# NovaCloud Demo Guide

This sequence is designed to show the largest amount of project value with minimal navigation.

## Before Presentation

```powershell
docker compose up -d
docker compose ps
```

Verify API and SQL Server are healthy.

Run frontend:

```powershell
npm --prefix frontend run build
npm --prefix frontend run start
```

Useful tabs to pre-open:

```text
http://localhost:3000
http://localhost:3000/admin/login
http://localhost:5128/swagger
http://localhost:5128/health
```

## Suggested Demo Flow

### 1. Public Website

Show:

- Home
- Services / Pricing
- Service Detail + QR
- News

Explain that anonymous customers can browse without authentication.

### 2. Customer Request

Create an Order or Contact request.

Point out the generated friendly reference code:

```text
ORD-...
CON-...
AFF-...
```

Then show `/track-request` using reference code + email.

### 3. Admin / Editor Workflow

Login to Admin Console.

Show:

- Dashboard
- request list/detail
- update request status
- notification
- audit log
- Excel export

### 4. Customer Account

Login as a User and show:

- `/account`
- `/account/requests`
- `/account/notifications`

Demonstrate that a status change made by Admin becomes visible to the customer.

### 5. RBAC / User Management

Show `/admin/users`:

- role filtering
- User → Editor change
- account lock/unlock

Explain that JWT validation re-checks current role and active state in SQL Server so old authorization is not trusted indefinitely after sensitive account changes.

### 6. Design Patterns

Open QR management for a Service Plan.

Explain:

```text
Repository → common data access
Unit of Work → coordinated SaveChanges boundary
Factory → choose PNG or SVG QR generator
```

### 7. DevOps / Quality

Show:

```powershell
docker compose ps
```

Then `/health` and GitHub Actions.

Mention:

```text
71 tests
Backend build/test CI
Frontend production build CI
Docker validation/build CI
```

## Backup Plan

If Docker Desktop has a classroom-machine issue, run backend locally:

```powershell
dotnet run --project backend\CloudService.WebApi
```

The feature demo can continue while Docker configuration is still documented in the repository and CI.
