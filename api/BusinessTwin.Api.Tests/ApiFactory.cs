using System.Net.Http.Json;
using BusinessTwin.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BusinessTwin.Api.Tests;

/// <summary>
/// The real API in memory, on an in-memory SQLite database instead of PostgreSQL, so these tests need no database
/// server. They cover API behaviour (auth, ownership, concurrency), not PostgreSQL specifics.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection connection = new("DataSource=:memory:");
    private bool created;

    public ApiFactory() => connection.Open();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection).UseSnakeCaseNamingConvention());
        });
    }

    /// <summary>A client with its own cookie jar, signed in as a new owner.</summary>
    public async Task<HttpClient> SignedInClientAsync(string email)
    {
        EnsureDatabase();
        // https, because the session cookie is Secure outside development.
        var client = CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
        var account = new { email, password = "Correct-horse-1" };
        (await client.PostAsJsonAsync("/api/auth/register", account)).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync("/api/auth/login?useCookies=true", account)).EnsureSuccessStatusCode();
        return client;
    }

    /// <summary>A database context outside any request; dispose the returned scope when done.</summary>
    public (IServiceScope Scope, AppDbContext Db) NewDbContext()
    {
        var scope = Services.CreateScope();
        return (scope, scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    private void EnsureDatabase()
    {
        if (created) return;
        var (scope, db) = NewDbContext();
        using (scope) db.Database.EnsureCreated();
        created = true;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) connection.Dispose();
    }
}
