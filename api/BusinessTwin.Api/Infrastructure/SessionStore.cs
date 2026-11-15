using System.Security.Claims;
using System.Security.Cryptography;
using BusinessTwin.Api.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

namespace BusinessTwin.Api.Infrastructure;

/// <summary>
/// Keeps sign-in tickets in the database instead of in the cookie (cookie <c>SessionStore</c>). The cookie then only
/// carries a random key, which lets the owner list the browsers signed in to their account and sign one out:
/// deleting the row ends that session on its next request. See docs/architecture.md.
/// </summary>
public sealed class SessionStore(IServiceScopeFactory scopes, IHttpContextAccessor http, TimeProvider clock) : ITicketStore
{
    /// <summary>Claim added to the signed-in principal so endpoints know which session is "this device".</summary>
    public const string SessionIdClaim = "bt:session";

    /// <summary>"Last seen" is written at most this often, so a busy page does not write on every request.</summary>
    private static readonly TimeSpan SeenGranularity = TimeSpan.FromMinutes(1);

    public async Task<string> StoreAsync(AuthenticationTicket ticket)
    {
        var userId = ticket.Principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("A sign-in ticket without a user id cannot be stored.");
        var now = clock.GetUtcNow();
        var session = new UserSession
        {
            Key = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)),
            UserId = userId,
            Device = DeviceLabel.From(http.HttpContext?.Request.Headers.UserAgent.ToString()),
            Ticket = Serialize(ticket),
            CreatedAt = now,
            LastSeenAt = now,
            ExpiresAt = ticket.Properties.ExpiresUtc,
        };

        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Tidy up this owner's expired sessions (filtered in memory: a handful of rows, and portable across providers).
        var expired = (await db.Sessions.Where(s => s.UserId == userId).ToListAsync())
            .Where(s => s.ExpiresAt is { } e && e < now);
        db.Sessions.RemoveRange(expired);
        db.Sessions.Add(session);
        await db.SaveChangesAsync();
        return session.Key;
    }

    public async Task RenewAsync(string key, AuthenticationTicket ticket)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var session = await db.Sessions.SingleOrDefaultAsync(s => s.Key == key);
        if (session is null) return; // signed out elsewhere meanwhile: stays signed out
        session.Ticket = Serialize(ticket);
        session.ExpiresAt = ticket.Properties.ExpiresUtc;
        session.LastSeenAt = clock.GetUtcNow();
        await db.SaveChangesAsync();
    }

    public async Task<AuthenticationTicket?> RetrieveAsync(string key)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var session = await db.Sessions.SingleOrDefaultAsync(s => s.Key == key);
        if (session is null) return null; // signed out (from this or another device) or account deleted

        var now = clock.GetUtcNow();
        if (now - session.LastSeenAt >= SeenGranularity)
        {
            session.LastSeenAt = now;
            await db.SaveChangesAsync();
        }

        var ticket = TicketSerializer.Default.Deserialize(session.Ticket);
        if (ticket?.Principal.Identity is ClaimsIdentity identity)
            identity.AddClaim(new Claim(SessionIdClaim, session.Id.ToString()));
        return ticket;
    }

    public async Task RemoveAsync(string key)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Sessions.Where(s => s.Key == key).ExecuteDeleteAsync();
    }

    /// <summary>Stores the ticket without the session claim added in <see cref="RetrieveAsync"/>.</summary>
    private static byte[] Serialize(AuthenticationTicket ticket)
    {
        if (ticket.Principal.Identity is ClaimsIdentity identity)
            foreach (var claim in identity.FindAll(SessionIdClaim).ToList())
                identity.RemoveClaim(claim);
        return TicketSerializer.Default.Serialize(ticket);
    }
}

/// <summary>A coarse, human label for a browser ("Safari on iPhone"). Deliberately not a fingerprint.</summary>
public static class DeviceLabel
{
    public static string From(string? userAgent)
    {
        var ua = userAgent ?? "";
        string? browser =
            ua.Contains("Edg/") || ua.Contains("EdgA/") || ua.Contains("EdgiOS/") ? "Edge"
            : ua.Contains("OPR/") ? "Opera"
            : ua.Contains("Firefox/") || ua.Contains("FxiOS/") ? "Firefox"
            : ua.Contains("SamsungBrowser/") ? "Samsung Internet"
            : ua.Contains("Chrome/") || ua.Contains("CriOS/") ? "Chrome"
            : ua.Contains("Safari/") ? "Safari"
            : null;
        string? os =
            ua.Contains("iPhone") ? "iPhone"
            : ua.Contains("iPad") ? "iPad"
            : ua.Contains("Android") ? "Android"
            : ua.Contains("Windows") ? "Windows"
            : ua.Contains("CrOS") ? "ChromeOS"
            : ua.Contains("Macintosh") || ua.Contains("Mac OS X") ? "Mac"
            : ua.Contains("Linux") ? "Linux"
            : null;
        return (browser, os) switch
        {
            (null, null) => "Unknown browser",
            (null, _) => $"Browser on {os}",
            (_, null) => browser,
            _ => $"{browser} on {os}",
        };
    }
}
