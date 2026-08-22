# Database and ERD

## 1. Database Technology

- SQL Server
- Entity Framework Core 8
- Code-first migrations
- `CloudServiceDbContext` in `CloudService.Infrastructure`

Every domain entity inherits `BaseEntity`, which provides:

- `Id : Guid`
- `CreatedAt : DateTime`
- `UpdatedAt : DateTime?`

## 2. ERD

```mermaid
erDiagram
    SERVICE_CATEGORY ||--o{ SERVICE_PLAN : contains
    SERVICE_PLAN ||--o{ PLAN_PRICE : has
    SERVICE_PLAN ||--o{ PROMOTION : has
    SERVICE_PLAN ||--o{ ORDER_REQUEST : receives
    APP_USER ||--o{ NOTIFICATION : receives

    SERVICE_CATEGORY {
        guid Id PK
        string Name
        string Description
        string Slug
        bool IsActive
        datetime CreatedAt
        datetime UpdatedAt
    }

    SERVICE_PLAN {
        guid Id PK
        guid ServiceCategoryId FK
        string Name
        string Description
        int CpuCores
        int RamGB
        int StorageGB
        int BandwidthGB
        bool IsFeatured
        bool IsActive
    }

    PLAN_PRICE {
        guid Id PK
        guid ServicePlanId FK
        decimal Price
        string BillingCycle
        bool IsActive
    }

    PROMOTION {
        guid Id PK
        guid ServicePlanId FK
        string Name
        string Description
        decimal DiscountPercent
        datetime StartDate
        datetime EndDate
        bool IsActive
    }

    ORDER_REQUEST {
        guid Id PK
        guid ServicePlanId FK
        string ReferenceCode UK
        string CustomerName
        string Email
        string PhoneNumber
        string CompanyName
        string BillingCycle
        string Note
        int Status
    }

    APP_USER {
        guid Id PK
        string FullName
        string Email UK
        string PasswordHash
        string Role
        bool IsActive
        string RefreshToken
        datetime RefreshTokenExpiryTime
    }

    NOTIFICATION {
        guid Id PK
        guid UserId FK
        string Title
        string Message
        string Type
        string Link
        bool IsRead
    }

    NEWS_ARTICLE {
        guid Id PK
        string Title
        string Slug
        string Summary
        string Content
        string ThumbnailUrl
        string Category
        bool IsPublished
        datetime PublishedAt
    }

    AFFILIATE_APPLICATION {
        guid Id PK
        string ReferenceCode UK
        string FullName
        string Email
        string PhoneNumber
        string CompanyName
        string Website
        string Note
        string Status
    }

    CONTACT_REQUEST {
        guid Id PK
        string ReferenceCode UK
        string FullName
        string Email
        string PhoneNumber
        string Subject
        string Message
        string Status
    }

    AUDIT_LOG {
        guid Id PK
        string UserId
        string UserName
        string UserRole
        string Action
        string EntityType
        guid EntityId
        string ReferenceCode
        string Description
        string OldValue
        string NewValue
    }
```

## 3. Relationship Notes

### ServiceCategory → ServicePlan

One category contains many service plans.

```text
ServiceCategory.Id
      ↓ 1:N
ServicePlan.ServiceCategoryId
```

### ServicePlan → PlanPrice

One service plan can expose multiple billing prices, for example monthly/yearly.

### ServicePlan → Promotion

One service plan can have multiple promotions.

### ServicePlan → OrderRequest

Every order request refers to the selected `ServicePlanId`.

### AppUser → Notification

`Notification.UserId` is an EF Core foreign key to `AppUser`; delete behavior is Cascade.

## 4. Email-based Customer History

`OrderRequest`, `ContactRequest` and `AffiliateApplication` intentionally keep customer email directly instead of requiring an `AppUser` foreign key. This supports anonymous users submitting requests before registering.

After a customer creates an account with the same email, the Customer Account service can show those earlier requests by normalized authenticated email.

## 5. Important Constraints / Indexes

The DbContext configures:

- unique `AppUser.Email`
- unique filtered reference codes for Order / Contact / Affiliate
- `PlanPrice.Price` precision `(18,2)`
- `Promotion.DiscountPercent` precision `(5,2)`
- Notification indexes by `UserId` and `(UserId, IsRead)`
- Audit Log indexes for time/action/entity/user
- Contact status and created-time indexes
