using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BusinessTwin.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<AppUser>(options)
{
    private const string Money = "numeric(14,2)";
    private const string Quantity = "numeric(12,4)";

    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<Baseline> Baselines => Set<Baseline>();
    public DbSet<Scenario> Scenarios => Set<Scenario>();
    public DbSet<ScenarioChange> Changes => Set<ScenarioChange>();
    public DbSet<ChangeEstimate> Estimates => Set<ChangeEstimate>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUser>().ToTable("users");
        builder.Entity<IdentityRole>().ToTable("roles");
        builder.Entity<IdentityRoleClaim<string>>().ToTable("role_claims");
        builder.Entity<IdentityUserClaim<string>>().ToTable("user_claims");
        builder.Entity<IdentityUserLogin<string>>().ToTable("user_logins");
        builder.Entity<IdentityUserRole<string>>().ToTable("user_roles");
        builder.Entity<IdentityUserToken<string>>().ToTable("user_tokens");

        builder.Entity<Business>(e =>
        {
            e.ToTable("businesses");
            e.HasIndex(b => b.OwnerId).IsUnique(); // one business per owner in the PoC
            e.HasOne(b => b.Owner).WithMany().HasForeignKey(b => b.OwnerId).OnDelete(DeleteBehavior.Cascade);
            e.Property(b => b.Name).HasMaxLength(100);
            e.Property(b => b.BusinessType).HasMaxLength(30);
        });

        builder.Entity<Baseline>(e =>
        {
            e.ToTable("baselines");
            e.HasIndex(b => b.BusinessId).IsUnique();
            e.HasOne(b => b.Business).WithOne(b => b.Baseline)
                .HasForeignKey<Baseline>(b => b.BusinessId).OnDelete(DeleteBehavior.Cascade);
            e.Property(b => b.VisitsPerMonth).HasColumnType(Quantity);
            e.Property(b => b.AveragePrice).HasColumnType(Money);
            e.Property(b => b.CostPerService).HasColumnType(Money);
            e.Property(b => b.StaffHoursPerMonth).HasColumnType(Quantity);
            e.Property(b => b.ServiceTimeHours).HasColumnType(Quantity);
            e.Property(b => b.WagesPerMonth).HasColumnType(Money);
            e.Property(b => b.OtherFixedCostsPerMonth).HasColumnType(Money);
            e.Property(b => b.CashOnHand).HasColumnType(Money);
            e.Property(b => b.InputSources).HasJsonbConversion();
        });

        builder.Entity<Scenario>(e =>
        {
            e.ToTable("scenarios");
            e.HasOne(s => s.Baseline).WithMany(b => b.Scenarios).OnDelete(DeleteBehavior.Cascade);
            e.Property(s => s.Name).HasMaxLength(100);
            e.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
        });

        builder.Entity<ScenarioChange>(e =>
        {
            e.ToTable("changes");
            e.HasOne(c => c.Scenario).WithMany(s => s.Changes).OnDelete(DeleteBehavior.Cascade);
            e.Property(c => c.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.Parameters).HasJsonbConversion();
        });

        builder.Entity<ChangeEstimate>(e =>
        {
            e.ToTable("estimates");
            e.HasOne(x => x.Change).WithMany(c => c.Estimates).HasForeignKey(x => x.ChangeId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.ChangeId, x.Field }).IsUnique();
            e.Property(x => x.Field).HasMaxLength(50);
            e.Property(x => x.Pessimistic).HasColumnType(Quantity);
            e.Property(x => x.Expected).HasColumnType(Quantity);
            e.Property(x => x.Optimistic).HasColumnType(Quantity);
        });
    }
}

internal static class JsonbPropertyExtensions
{
    private static readonly JsonSerializerOptions Options = new()
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    /// <summary>Stores a dictionary as a jsonb column.</summary>
    public static PropertyBuilder<Dictionary<string, TValue>> HasJsonbConversion<TValue>(
        this PropertyBuilder<Dictionary<string, TValue>> property)
    {
        property.HasConversion(
                v => JsonSerializer.Serialize(v, Options),
                v => JsonSerializer.Deserialize<Dictionary<string, TValue>>(v, Options) ?? new(),
                new ValueComparer<Dictionary<string, TValue>>(
                    (a, b) => JsonSerializer.Serialize(a, Options) == JsonSerializer.Serialize(b, Options),
                    v => JsonSerializer.Serialize(v, Options).GetHashCode(),
                    v => new Dictionary<string, TValue>(v)))
            .HasColumnType("jsonb");
        return property;
    }
}
