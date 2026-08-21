# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["backend/CloudService.Domain/CloudService.Domain.csproj", "backend/CloudService.Domain/"]
COPY ["backend/CloudService.Application/CloudService.Application.csproj", "backend/CloudService.Application/"]
COPY ["backend/CloudService.Infrastructure/CloudService.Infrastructure.csproj", "backend/CloudService.Infrastructure/"]
COPY ["backend/CloudService.WebApi/CloudService.WebApi.csproj", "backend/CloudService.WebApi/"]

RUN dotnet restore "backend/CloudService.WebApi/CloudService.WebApi.csproj"

COPY backend/ backend/

WORKDIR "/src/backend/CloudService.WebApi"
RUN dotnet publish "CloudService.WebApi.csproj" \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# curl được dùng bởi Docker healthcheck của Web API.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "CloudService.WebApi.dll"]
