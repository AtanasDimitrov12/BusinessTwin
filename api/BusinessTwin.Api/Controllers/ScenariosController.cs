using BusinessTwin.Api.Contracts;
using BusinessTwin.Api.Data;
using BusinessTwin.Engine;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusinessTwin.Api.Controllers;

/// <summary>What-if scenarios on the owner's baseline, and their results (recalculated on every request).</summary>
[ApiController]
[Authorize]
[Route("api/scenarios")]
public class ScenariosController(AppDbContext db, OwnerScope owner) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ScenarioDto>>> List(CancellationToken ct)
    {
        var scenarios = await owner.Scenarios.AsNoTracking()
            .Include(s => s.Changes).ThenInclude(c => c.Estimates)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);
        return scenarios.Select(EngineMapping.ToDto).ToList();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ScenarioDto>> Get(Guid id, CancellationToken ct)
    {
        var scenario = await LoadAsync(id, tracking: false, ct);
        return scenario is null ? NotFound() : EngineMapping.ToDto(scenario);
    }

    [HttpPost]
    public async Task<ActionResult<ScenarioDto>> Create(SaveScenarioRequest request, CancellationToken ct)
    {
        if (HorizonProblem(request.HorizonMonths, request.Changes) is { } problem) return problem;

        var baseline = await owner.Baselines.SingleOrDefaultAsync(ct);
        if (baseline is null) return NoBaseline();

        var scenario = new Scenario
        {
            BaselineId = baseline.Id,
            Name = request.Name.Trim(),
            HorizonMonths = request.HorizonMonths,
            Status = request.Status,
            Changes = request.Changes.Select(EngineMapping.ToEntity).ToList(),
        };
        db.Scenarios.Add(scenario);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = scenario.Id }, EngineMapping.ToDto(scenario));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ScenarioDto>> Update(Guid id, SaveScenarioRequest request, CancellationToken ct)
    {
        if (HorizonProblem(request.HorizonMonths, request.Changes) is { } problem) return problem;

        var scenario = await LoadAsync(id, tracking: true, ct);
        if (scenario is null) return NotFound();

        scenario.Name = request.Name.Trim();
        scenario.HorizonMonths = request.HorizonMonths;
        scenario.Status = request.Status;
        db.Changes.RemoveRange(scenario.Changes);
        scenario.Changes = request.Changes.Select(EngineMapping.ToEntity).ToList();
        await db.SaveChangesAsync(ct);
        return EngineMapping.ToDto(scenario);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var scenario = await owner.Scenarios.SingleOrDefaultAsync(s => s.Id == id, ct);
        if (scenario is null) return NotFound();

        db.Scenarios.Remove(scenario);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>Month-by-month results of a saved scenario for the three cases, compared with the baseline.</summary>
    [HttpGet("{id:guid}/results")]
    public async Task<ActionResult<SimulationResultDto>> Results(Guid id, CancellationToken ct)
    {
        var scenario = await LoadAsync(id, tracking: false, ct);
        if (scenario is null) return NotFound();

        var changes = scenario.Changes.Select(EngineMapping.ToDto).Select(EngineMapping.ToEngine).ToList();
        var result = ScenarioEngine.Simulate(new ScenarioInput(EngineMapping.ToEngine(scenario.Baseline!), changes, scenario.HorizonMonths));
        return ResultMapping.ToDto(result);
    }

    /// <summary>Runs unsaved changes against the baseline: the live preview while the owner builds a scenario.</summary>
    [HttpPost("simulate")]
    public async Task<ActionResult<SimulationResultDto>> Simulate(SimulateRequest request, CancellationToken ct)
    {
        if (HorizonProblem(request.HorizonMonths, request.Changes) is { } problem) return problem;

        var baseline = await owner.Baselines.AsNoTracking().SingleOrDefaultAsync(ct);
        if (baseline is null) return NoBaseline();

        var changes = request.Changes.Select(EngineMapping.ToEngine).ToList();
        var result = ScenarioEngine.Simulate(new ScenarioInput(EngineMapping.ToEngine(baseline), changes, request.HorizonMonths));
        return ResultMapping.ToDto(result);
    }

    private Task<Scenario?> LoadAsync(Guid id, bool tracking, CancellationToken ct)
    {
        var query = owner.Scenarios
            .Include(s => s.Baseline)
            .Include(s => s.Changes).ThenInclude(c => c.Estimates)
            .Where(s => s.Id == id);
        return (tracking ? query : query.AsNoTracking()).SingleOrDefaultAsync(ct);
    }

    private ActionResult? HorizonProblem(int horizon, IEnumerable<ChangeDto> changes)
    {
        if (changes.All(c => c.StartMonth <= horizon)) return null;
        ModelState.AddModelError("Changes", "Every change must start within the time horizon.");
        return ValidationProblem(ModelState);
    }

    private ObjectResult NoBaseline() =>
        Problem("Enter your baseline before testing a decision.", statusCode: StatusCodes.Status409Conflict);
}
