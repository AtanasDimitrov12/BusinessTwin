using BusinessTwin.Api.Data;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusinessTwin.Api.Infrastructure;

/// <summary>
/// Optimistic concurrency for owner edits. A save carries the version the client loaded; if the stored row has
/// moved on (another device or tab saved first), the API answers 409 with <c>code: "edit-conflict"</c> so the web
/// app can offer "load the latest" or "keep mine" instead of silently overwriting.
/// </summary>
public static class EditConflict
{
    public const string Code = "edit-conflict";

    public static ProblemDetails Problem() => new()
    {
        Status = StatusCodes.Status409Conflict,
        Title = "Changed somewhere else",
        Detail = "This was changed on another device or in another tab after you opened it.",
        Extensions = { ["code"] = Code },
    };

    /// <summary>
    /// Accepts a save of <paramref name="row"/> only if the client loaded the version stored now, and bumps it.
    /// Because the version always changes, EF writes the row with "WHERE version = loaded", so a save by someone
    /// else between this check and SaveChanges still fails (see <see cref="Handler"/>).
    /// Returns null when the save may go ahead, otherwise the response to send.
    /// </summary>
    public static ActionResult? Claim(IVersioned? row, int? loadedVersion)
    {
        // No row and no version: a create. Otherwise the client must have loaded exactly the stored version.
        // A version for a row that no longer exists means it was deleted elsewhere; no version for a row that
        // exists means it was created elsewhere (e.g. set-up finished on another device). Both are conflicts.
        if (row is null) return loadedVersion is null ? null : Result();
        if (row.Version != loadedVersion) return Result();

        row.Version = loadedVersion.Value + 1;
        return null;
    }

    private static ObjectResult Result() => new(Problem())
    {
        StatusCode = StatusCodes.Status409Conflict,
        ContentTypes = { "application/problem+json" },
    };

    /// <summary>Turns the race that slips past <see cref="Claim"/> (two saves in the same instant) into the same 409.</summary>
    public sealed class Handler(IProblemDetailsService problemDetails) : IExceptionHandler
    {
        public async ValueTask<bool> TryHandleAsync(HttpContext http, Exception exception, CancellationToken ct)
        {
            if (exception is not DbUpdateConcurrencyException) return false;

            http.Response.StatusCode = StatusCodes.Status409Conflict;
            return await problemDetails.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = http,
                Exception = exception,
                ProblemDetails = Problem(),
            });
        }
    }
}
