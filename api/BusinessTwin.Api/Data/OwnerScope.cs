using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace BusinessTwin.Api.Data;

/// <summary>
/// Ownership guard. Every read of owner data goes through these queries, which are already filtered
/// to the signed-in owner, so one salon can never load another's data. Controllers must not query
/// the owner tables on <see cref="AppDbContext"/> directly.
/// </summary>
public class OwnerScope(AppDbContext db, IHttpContextAccessor http)
{
    public string UserId =>
        http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("OwnerScope used outside an authenticated request.");

    public IQueryable<Business> Businesses => db.Businesses.Where(b => b.OwnerId == UserId);

    public IQueryable<Baseline> Baselines => db.Baselines.Where(b => b.Business!.OwnerId == UserId);

    public IQueryable<Scenario> Scenarios => db.Scenarios.Where(s => s.Baseline!.Business!.OwnerId == UserId);

    public Task<Business?> GetBusinessAsync(CancellationToken ct) =>
        Businesses.Include(b => b.Baseline).SingleOrDefaultAsync(ct);
}
