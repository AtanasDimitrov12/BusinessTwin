using BusinessTwin.Api.Contracts;
using BusinessTwin.Api.Data;
using BusinessTwin.Engine;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaselineEntity = BusinessTwin.Api.Data.Baseline;

namespace BusinessTwin.Api.Controllers;

/// <summary>Today's monthly baseline of the owner's business and its calculated summary.</summary>
[ApiController]
[Authorize]
[Route("api/baseline")]
public class BaselineController(AppDbContext db, OwnerScope owner) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<BaselineDto>> Get(CancellationToken ct)
    {
        var baseline = await owner.Baselines.AsNoTracking().SingleOrDefaultAsync(ct);
        return baseline is null ? NotFound() : ToDto(baseline);
    }

    [HttpPut]
    public async Task<ActionResult<BaselineDto>> Save(BaselineInput input, CancellationToken ct)
    {
        var unknown = input.Sources.Keys.Except(BaselineInput.FieldNames).ToList();
        if (unknown.Count > 0)
        {
            ModelState.AddModelError(nameof(input.Sources), $"Unknown fields: {string.Join(", ", unknown)}.");
            return ValidationProblem(ModelState);
        }

        var business = await owner.GetBusinessAsync(ct);
        if (business is null)
            return Problem("Create your business before entering a baseline.", statusCode: StatusCodes.Status409Conflict);

        var baseline = business.Baseline;
        if (baseline is null)
        {
            baseline = new BaselineEntity { BusinessId = business.Id };
            db.Baselines.Add(baseline);
        }

        baseline.VisitsPerMonth = input.VisitsPerMonth;
        baseline.AveragePrice = input.AveragePrice;
        baseline.CostPerService = input.CostPerService;
        baseline.StaffHoursPerMonth = input.StaffHoursPerMonth;
        baseline.ServiceTimeHours = input.ServiceTimeHours;
        baseline.WagesPerMonth = input.WagesPerMonth;
        baseline.OtherFixedCostsPerMonth = input.OtherFixedCostsPerMonth;
        baseline.CashOnHand = input.CashOnHand;
        // Every value carries a source label; anything the owner did not label counts as entered.
        baseline.InputSources = BaselineInput.FieldNames.ToDictionary(
            f => f, f => input.Sources.GetValueOrDefault(f, SourceLabel.Entered));
        baseline.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        return ToDto(baseline);
    }

    /// <summary>The baseline dashboard figures, recalculated by the scenario engine on every request.</summary>
    [HttpGet("summary")]
    public async Task<ActionResult<BaselineSummaryDto>> Summary(CancellationToken ct)
    {
        var baseline = await owner.Baselines.AsNoTracking().SingleOrDefaultAsync(ct);
        if (baseline is null) return NotFound();

        var m = ScenarioEngine.SummariseBaseline(EngineMapping.ToEngine(baseline));
        return new BaselineSummaryDto(
            m.Capacity, m.ServicesDelivered, m.UnservedDemand, m.UnusedCapacity, m.Utilisation,
            m.Revenue, m.VariableCosts, m.Contribution, m.FixedCosts, m.MonthlyResult, m.CashAtEnd);
    }

    private static BaselineDto ToDto(BaselineEntity b) => new(
        b.VisitsPerMonth, b.AveragePrice, b.CostPerService, b.StaffHoursPerMonth, b.ServiceTimeHours,
        b.WagesPerMonth, b.OtherFixedCostsPerMonth, b.CashOnHand, b.InputSources, b.UpdatedAt);
}
