using System.Text.Json;
using System.Text.Json.Serialization;
using BusinessTwin.Api.Data;
using BusinessTwin.Api.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database: connection string comes from configuration (env var ConnectionStrings__Default or user-secrets), never the repo.
builder.Services.AddDbContext<AppDbContext>(options => options
    .UseNpgsql(builder.Configuration.GetConnectionString("Default"))
    .UseSnakeCaseNamingConvention());

// Authentication: ASP.NET Core Identity with an HTTP-only session cookie.
builder.Services.AddAuthorization();
builder.Services.AddIdentityApiEndpoints<AppUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 10;
    })
    .AddEntityFrameworkStores<AppDbContext>();
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "bt_session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<OwnerScope>();

// JSON: money as decimal strings, enums as camelCase strings. Applied to controllers and minimal APIs alike.
void ConfigureJson(JsonSerializerOptions json)
{
    json.NumberHandling = JsonNumberHandling.Strict;
    json.Converters.Add(new DecimalStringConverter());
    json.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
}
builder.Services.AddControllers().AddJsonOptions(o => ConfigureJson(o.JsonSerializerOptions));
builder.Services.ConfigureHttpJsonOptions(o => ConfigureJson(o.SerializerOptions));
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<InvalidScenarioHandler>();

// OpenAPI: the web app generates its TypeScript types from this document (also written at build time to api/openapi/).
builder.Services.AddOpenApi(options => options.AddSchemaTransformer<DecimalAsStringSchemaTransformer>());

// CORS only when the web app is served from another origin. In development Vite proxies /api, so none is needed.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();

if (app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
}

app.UseExceptionHandler();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

var auth = app.MapGroup("/api/auth").WithTags("Auth");
auth.MapIdentityApi<AppUser>();
auth.MapPost("/logout", async (SignInManager<AppUser> signIn) =>
{
    await signIn.SignOutAsync();
    return Results.NoContent();
}).RequireAuthorization();

// Deletes the account; the business, baseline and all scenarios go with it (cascade on businesses.owner_id).
auth.MapDelete("/account", async (OwnerScope owner, UserManager<AppUser> users, SignInManager<AppUser> signIn) =>
{
    var user = await users.FindByIdAsync(owner.UserId);
    if (user is null) return Results.NotFound();

    var result = await users.DeleteAsync(user);
    if (!result.Succeeded)
        return Results.Problem(string.Join(" ", result.Errors.Select(e => e.Description)));

    await signIn.SignOutAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapGet("/api/health", async (AppDbContext db, CancellationToken ct) =>
    await db.Database.CanConnectAsync(ct)
        ? Results.Ok(new HealthDto("ok", "up"))
        : Results.Json(new HealthDto("degraded", "down"), statusCode: StatusCodes.Status503ServiceUnavailable))
    .WithTags("Health");

app.MapControllers();

app.Run();

record HealthDto(string Status, string Database);
