using BusinessTwin.Api.Contracts;
using BusinessTwin.Api.Data;
using BusinessTwin.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusinessTwin.Api.Controllers;

/// <summary>The devices signed in to the owner's account, and signing them out.</summary>
[ApiController]
[Authorize]
[Route("api/auth/sessions")]
public class SessionsController(AppDbContext db, OwnerScope owner, TimeProvider clock) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SessionDto>>> List(CancellationToken ct)
    {
        var current = CurrentSessionId();
        var now = clock.GetUtcNow();
        // Sorted and filtered in memory: a handful of rows per owner.
        var sessions = await db.Sessions.AsNoTracking().Where(s => s.UserId == owner.UserId).ToListAsync(ct);
        return sessions
            .Where(s => s.ExpiresAt is null || s.ExpiresAt > now)
            .OrderByDescending(s => s.Id == current)
            .ThenByDescending(s => s.LastSeenAt)
            .Select(s => new SessionDto(s.Id, s.Device, s.CreatedAt, s.LastSeenAt, s.Id == current))
            .ToList();
    }

    /// <summary>Signs another device out. It is asked to sign in again on its next request.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> SignOut(Guid id, CancellationToken ct)
    {
        if (id == CurrentSessionId())
            return Problem("Use Sign out to sign out this device.", statusCode: StatusCodes.Status400BadRequest);

        var deleted = await db.Sessions.Where(s => s.Id == id && s.UserId == owner.UserId).ExecuteDeleteAsync(ct);
        return deleted == 0 ? NotFound() : NoContent();
    }

    /// <summary>Signs out every device except this one.</summary>
    [HttpPost("sign-out-others")]
    public async Task<IActionResult> SignOutOthers(CancellationToken ct)
    {
        var current = CurrentSessionId();
        await db.Sessions.Where(s => s.UserId == owner.UserId && s.Id != current).ExecuteDeleteAsync(ct);
        return NoContent();
    }

    private Guid? CurrentSessionId() =>
        Guid.TryParse(User.FindFirst(SessionStore.SessionIdClaim)?.Value, out var id) ? id : null;
}
