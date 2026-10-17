namespace BusinessTwin.Engine.Components;

/// <summary>Splits the difference between a scenario run and the baseline run into causes the owner can follow.</summary>
internal static class DriverExplainer
{
    public static (Drivers Drivers, IReadOnlyList<decimal> CumulativeGapByMonth) Explain(
        Baseline baseline,
        IReadOnlyList<Change> changes,
        IReadOnlyList<MonthResult> baselineMonths,
        IReadOnlyList<MonthResult> scenarioMonths)
    {
        var baseContributionPerVisit = baseline.AveragePrice - baseline.CostPerService;
        var firstChangeMonth = changes.Count == 0 ? (int?)null : changes.Min(c => c.StartMonth);

        decimal extraVisits = 0m, priceEffect = 0m, wages = 0m, marketing = 0m, lostRevenue = 0m, gap = 0m;
        int? breakEvenMonth = null;
        var gapByMonth = new List<decimal>(scenarioMonths.Count);

        for (var i = 0; i < scenarioMonths.Count; i++)
        {
            var s = scenarioMonths[i];
            var b = baselineMonths[i];
            var active = changes.Where(c => c.IsActiveIn(s.Month)).ToList();

            extraVisits += (s.ServicesDelivered - b.ServicesDelivered) * baseContributionPerVisit;
            priceEffect += s.ServicesDelivered * (s.AveragePrice - baseline.AveragePrice);
            wages -= active.OfType<HireChange>().Sum(h => h.EmployerCostPerMonth);
            marketing -= active.OfType<MarketingChange>().Sum(m => m.CostPerMonth);
            lostRevenue += s.UnservedDemand * s.AveragePrice;

            if (firstChangeMonth is { } start && s.Month >= start)
            {
                gap += s.MonthlyResult - b.MonthlyResult;
                if (breakEvenMonth is null && s.MonthlyResult >= b.MonthlyResult)
                    breakEvenMonth = s.Month;
            }
            gapByMonth.Add(gap);
        }

        var drivers = new Drivers(
            ExtraVisitsContribution: extraVisits,
            PriceEffect: priceEffect,
            AddedWageCosts: wages,
            MarketingCosts: marketing,
            TotalDifference: extraVisits + priceEffect + wages + marketing,
            RevenueLostToUnservedDemand: lostRevenue,
            BreakEvenNewVisitsPerMonth: BreakEvenVisits(baseline, changes),
            BreakEvenMonth: breakEvenMonth,
            CumulativeGap: gap);

        return (drivers, gapByMonth);
    }

    /// <summary>Added monthly fixed cost of all changes ÷ contribution per visit at the scenario's final price.</summary>
    private static decimal? BreakEvenVisits(Baseline baseline, IReadOnlyList<Change> changes)
    {
        var addedFixedCost = changes.OfType<HireChange>().Sum(h => h.EmployerCostPerMonth)
                           + changes.OfType<MarketingChange>().Sum(m => m.CostPerMonth);
        var price = changes.OfType<PriceChange>().OrderBy(p => p.StartMonth).LastOrDefault()?.NewPrice
                    ?? baseline.AveragePrice;
        var contributionPerVisit = price - baseline.CostPerService;

        if (addedFixedCost == 0m || contributionPerVisit <= 0m) return null;
        return addedFixedCost / contributionPerVisit;
    }
}
