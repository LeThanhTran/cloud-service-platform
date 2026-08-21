# NovaCloud - Docker Deployment

Branch đề xuất: `feature/docker-deployment`

## Thành phần

- `backend/CloudService.WebApi/Dockerfile`
  - Multi-stage build .NET 8
  - Runtime chạy cổng 8080 trong container
- `docker-compose.yml`
  - `api`: ASP.NET Core Web API
  - `sqlserver`: SQL Server 2022 Developer
- `.env.example`
  - mẫu biến môi trường cho mật khẩu `sa`
- `.dockerignore`
  - loại trừ bin/obj/node_modules/.git/.next...
- `Program.cs`
  - hỗ trợ tự động chạy EF Core migrations khi
    `Database:ApplyMigrationsOnStartup=true`
  - có retry vì SQL Server thường khởi động chậm hơn API

## Cổng

- API ngoài máy: `http://localhost:5128`
- Swagger: `http://localhost:5128/swagger`
- SQL Server: `localhost,1433`
- Frontend vẫn chạy local: `http://localhost:3000`

## Chạy

PowerShell tại root project:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Chờ log API có dòng đại loại:

```text
Database migrations applied successfully
Now listening on: http://[::]:8080
```

Sau đó mở:

```text
http://localhost:5128/swagger
```

Frontend vẫn có thể chạy:

```powershell
npm --prefix frontend run dev
```

vì Docker map API về đúng cổng 5128 mà frontend hiện dùng.

## Kiểm tra container

```powershell
docker compose ps
```

Kỳ vọng có:

```text
novacloud-api        Up
novacloud-sqlserver  Up
```

## Dừng

Giữ dữ liệu SQL Server:

```powershell
docker compose down
```

Xóa cả dữ liệu/volume để test từ đầu:

```powershell
docker compose down -v
```

## Lưu ý Email

Email SMTP được tắt trong compose (`Email__Enabled=false`) vì .NET User Secrets
trên máy local không tự được copy vào container.

Nếu cần demo Email bên trong Docker về sau, hãy truyền credential bằng
environment variable / secret, không ghi App Password vào source.
