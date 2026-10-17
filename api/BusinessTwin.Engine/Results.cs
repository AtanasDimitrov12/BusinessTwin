namespace BusinessTwin.Engine;

/// <summary>All calculated quantities for one month of one run. Values are exact; rounding is for display only.</summary>
public sealed record MonthResult(
    int Month,
    decimal Demand,
    decimal Capacity,
    decimal ServicesDelivered,
    decimal UnservedDemand,
    decimal UnusedCapacity,
    decimal Utilisation,
    decimal AveragePrice,
    decimal Revenue,
    decimal VariableCosts,
    decimal Contribution,
    decimal FixedCosts,
    decimal MonthlyResult,
    decimal CashAtEnd,
    bool CashShortfall);

/// <summary>
/// Why the scenario differs from the baseline over the horizon. The four effects add up exactly
/// to <see cref="TotalDifference"/>; <see cref="RevenueLostToUnservedDemand"/> is extra information.
/// </summary>
public sealed record Drivers(
    decimal ExtraVisitsContribution,
    decimal PriceEffect,
    decimal AddedWageCosts,
    decimal MarketingCosts,
    decimal TotalDifference,
    decimal RevenueLostToUnservedDemand,
    decimal? BreakEvenNewVisitsPerMonth,
    int? BreakEvenMonth,
    decimal CumulativeGap);

public sealed record CaseResult(
    Case Case,
    IReadOnlyList<MonthResult> Months,
    IReadOnlyList<decimal> CumulativeGapByMonth,
    Drivers Drivers)
{
    public IEnumerable<int> ShortfallMonths => Months.Where(m => m.CashShortfall).Select(m => m.Month);
}

public sealed record SimulationResult(IReadOnlyList<MonthResult> Baseline, IReadOnlyList<CaseResult> Cases)
{
    public CaseResult For(Case @case) => Cases.Single(c => c.Case == @case);
}
