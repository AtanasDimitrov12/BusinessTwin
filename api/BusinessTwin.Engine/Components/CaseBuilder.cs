namespace BusinessTwin.Engine.Components;

/// <summary>The resolved drivers of one month in one case, after all active changes are applied.</summary>
internal sealed record MonthPlan(
    decimal Demand,
    decimal StaffHours,
    decimal AveragePrice,
    decimal Wages,
    decimal MarketingSpend);

/// <summary>Turns a baseline plus changes into a month plan for one case, picking that case's value of every estimate.</summary>
internal static class CaseBuilder
{
    public static MonthPlan Plan(Baseline baseline, IReadOnlyList<Change> changes, Case @case, int month)
    {
        var active = changes.Where(c => c.IsActiveIn(month)).ToList();
        var hires = active.OfType<HireChange>().ToList();
        var marketing = active.OfType<MarketingChange>().ToList();
        // When price changes are stacked, the most recent one sets the price and its demand effect.
        var price = active.OfType<PriceChange>().OrderBy(p => p.StartMonth).LastOrDefault();

        return new MonthPlan(
            Demand: DemandModel.Demand(baseline, hires, marketing, price, @case, month),
            StaffHours: baseline.StaffHoursPerMonth + hires.Sum(h => h.HoursPerMonth),
            AveragePrice: price?.NewPrice ?? baseline.AveragePrice,
            Wages: baseline.WagesPerMonth + hires.Sum(h => h.EmployerCostPerMonth),
            MarketingSpend: marketing.Sum(m => m.CostPerMonth));
    }

    public static MonthPlan BaselinePlan(Baseline baseline) => Plan(baseline, [], Case.Expected, 1);
}
