using BusinessTwin.Engine;

namespace BusinessTwin.Api.Contracts;

/// <summary>
/// Shapes engine output for the web app. Every derived number the screens show (totals, differences,
/// waterfall positions) is computed here in decimal, so the browser only formats and draws.
/// </summary>
public static class ResultMapping
{
    public static SimulationResultDto ToDto(SimulationResult result)
    {
        var baselineSummary = Summarise(result.Baseline);
        return new SimulationResultDto(
            result.Baseline.Count,
            result.Baseline.Select(ToDto).ToList(),
            baselineSummary,
            result.Cases.Select(c => ToDto(c, result.Baseline, baselineSummary)).ToList());
    }

    private static CaseResultDto ToDto(CaseResult c, IReadOnlyList<MonthResult> baseline, RunSummaryDto baselineSummary)
    {
        var summary = Summarise(c.Months);
        var d = c.Drivers;
        return new CaseResultDto(
            c.Case,
            c.Months.Select(ToDto).ToList(),
            c.Months.Zip(baseline, (s, b) => s.MonthlyResult - b.MonthlyResult).ToList(),
            c.CumulativeGapByMonth,
            c.ShortfallMonths.ToList(),
            summary,
            new SummaryDifferenceDto(
                summary.TotalServed - baselineSummary.TotalServed,
                summary.TotalRevenue - baselineSummary.TotalRevenue,
                summary.TotalFixedCosts - baselineSummary.TotalFixedCosts,
                summary.TotalResult - baselineSummary.TotalResult,
                summary.AverageMonthlyResult - baselineSummary.AverageMonthlyResult,
                summary.EndCash - baselineSummary.EndCash),
            new DriversDto(
                d.ExtraVisitsContribution, d.PriceEffect, d.AddedWageCosts, d.MarketingCosts, d.TotalDifference,
                d.RevenueLostToUnservedDemand, d.BreakEvenNewVisitsPerMonth, d.BreakEvenMonth, d.CumulativeGap),
            Waterfall(baselineSummary.TotalResult, d));
    }

    /// <summary>Baseline total → each driver → scenario total, as floating bars.</summary>
    private static List<WaterfallStepDto> Waterfall(decimal baselineTotal, Drivers d)
    {
        var steps = new List<WaterfallStepDto> { Bar("baseline", baselineTotal, 0m, baselineTotal) };
        var running = baselineTotal;
        foreach (var (key, amount) in new[]
                 {
                     ("extraVisits", d.ExtraVisitsContribution),
                     ("price", d.PriceEffect),
                     ("wages", d.AddedWageCosts),
                     ("marketing", d.MarketingCosts),
                 })
        {
            if (amount == 0m) continue;
            steps.Add(Bar(key, amount, running, running + amount));
            running += amount;
        }
        steps.Add(Bar("scenario", running, 0m, running));
        return steps;

        static WaterfallStepDto Bar(string key, decimal amount, decimal from, decimal to) =>
            new(key, amount, Math.Min(from, to), Math.Max(from, to));
    }

    private static RunSummaryDto Summarise(IReadOnlyList<MonthResult> months)
    {
        var lowest = months.MinBy(m => m.CashAtEnd)!;
        var totalResult = months.Sum(m => m.MonthlyResult);
        return new RunSummaryDto(
            TotalServed: months.Sum(m => m.ServicesDelivered),
            TotalUnserved: months.Sum(m => m.UnservedDemand),
            TotalRevenue: months.Sum(m => m.Revenue),
            TotalFixedCosts: months.Sum(m => m.FixedCosts),
            TotalResult: totalResult,
            AverageMonthlyResult: totalResult / months.Count,
            EndCash: months[^1].CashAtEnd,
            LowestCash: lowest.CashAtEnd,
            LowestCashMonth: lowest.Month,
            LastMonthUtilisation: months[^1].Utilisation);
    }

    private static MonthResultDto ToDto(MonthResult m) => new(
        m.Month, m.Demand, m.Capacity, m.ServicesDelivered, m.UnservedDemand, m.UnusedCapacity, m.Utilisation,
        m.AveragePrice, m.Revenue, m.VariableCosts, m.Contribution, m.FixedCosts, m.MonthlyResult, m.CashAtEnd,
        m.CashShortfall);
}
