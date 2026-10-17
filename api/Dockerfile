FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY BusinessTwin.slnx ./
COPY BusinessTwin.Api/BusinessTwin.Api.csproj BusinessTwin.Api/
COPY BusinessTwin.Engine/BusinessTwin.Engine.csproj BusinessTwin.Engine/
COPY BusinessTwin.Engine.Tests/BusinessTwin.Engine.Tests.csproj BusinessTwin.Engine.Tests/
RUN dotnet restore BusinessTwin.Api/BusinessTwin.Api.csproj
COPY . .
# The OpenAPI document is generated during local builds; skip it in the image.
RUN dotnet publish BusinessTwin.Api/BusinessTwin.Api.csproj -c Release -o /app --no-restore -p:OpenApiGenerateDocuments=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "BusinessTwin.Api.dll"]
