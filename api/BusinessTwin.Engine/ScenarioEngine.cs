using BusinessTwin.Engine.Components;

namespace BusinessTwin.Engine;

/// <summary>
/// Entry point of the scenario engine. Pure and deterministic: same input, same output, no I/O.
/// Runs the baseline once and the scenario once per case, then explains the difference.
/// </summary>
public static class ScenarioEngine
{
    public const int MaxHorizonMonths = 36;

    public static SimulationResult Simulate(ScenarioInput input)
    {
        Validate(input);
        var (baseline, changes, horizon) = (input.Baseline, input.Changes, input.HorizonMonths);

        var baselinePlan = CaseBuilder.BaselinePlan(baseline);
        var baselineMonths = CashFlowSimulator.Run(baseline, horizon, _ => baselinePlan);

        var cases = Enum.GetValues<Case>().Select(@case =>
        {
            var months = CashFlowSimulator.Run(baseline, horizon, m => CaseBuilder.Plan(baseline, changes, @case, m));
            var (drivers, gapByMonth) = DriverExplainer.Explain(baseline, changes, baselineMonths, months);
            return new CaseResult(@case, months, gapByMonth, drivers);
        }).ToList();

        return new SimulationResult(baselineMonths, cases);
    }

    /// <summary>The baseline on its own for one month: the figures behind the baseline dashboard.</summary>
    public static MonthResult SummariseBaseline(Baseline baseline)
    {
        Validate(new ScenarioInput(baseline, [], 1));
        var plan = CaseBuilder.BaselinePlan(baseline);
        return CashFlowSimulator.Run(baseline, 1, _ => plan)[0];
    }

    private static void Validate(ScenarioInput input)
    {
        if (input.HorizonMonths is < 1 or > MaxHorizonMonths)
            throw new InvalidScenarioException($"Horizon must be 1 to {MaxHorizonMonths} months.");
        if (input.Baseline.ServiceTimeHours <= 0m)
            throw new InvalidScenarioException("Service time must be greater than zero.");
        if (input.Changes.Any(c => c.StartMonth < 1 || c.StartMonth > input.HorizonMonths))
            throw new InvalidScenarioException("Every change must start within the horizon.");
        if (input.Changes.OfType<HireChange>().Any(h => h.RampUpMonths < 1))
            throw new InvalidScenarioException("Ramp-up must be at least one month.");
    }
}

/// <summary>
/// The input breaks a rule of the model. The API validates the same rules first; if one still slips
/// through, it answers 400 with this message instead of a 500.
/// </summary>
public sealed class InvalidScenarioException(string message) : Exception(message);
