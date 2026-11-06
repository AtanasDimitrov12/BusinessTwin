using BusinessTwin.Engine;
using Microsoft.AspNetCore.Diagnostics;

namespace BusinessTwin.Api.Infrastructure;

/// <summary>
/// The API validates every engine rule before calling the engine; the engine checks them again.
/// If an input still breaks a rule, the owner gets a 400 with the engine's message, not a 500.
/// When adding a rule to the engine, add it to the API validation too.
/// </summary>
public sealed class InvalidScenarioHandler(IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext http, Exception exception, CancellationToken ct)
    {
        if (exception is not InvalidScenarioException) return false;

        http.Response.StatusCode = StatusCodes.Status400BadRequest;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = http,
            Exception = exception,
            ProblemDetails = { Status = StatusCodes.Status400BadRequest, Title = "Invalid scenario", Detail = exception.Message },
        });
    }
}
