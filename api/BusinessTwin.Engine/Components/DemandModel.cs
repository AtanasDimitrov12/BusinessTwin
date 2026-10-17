namespace BusinessTwin.Engine.Components;

/// <summary>How many visits customers want in a month. Independent of how many the team can deliver.</summary>
internal static class DemandModel
{
    public static decimal Demand(
        Baseline baseline,
        IEnumerable<HireChange> hires,
        IEnumerable<MarketingChange> marketing,
        PriceChange? price,
        Case @case)
    {
        // Only new customers of a hire add demand; moved customers were already counted in the baseline.
        var fromHires = hires.Sum(h => h.CustomersPerMonth.For(@case) * h.NewCustomerShare.For(@case));
        var fromMarketing = marketing.Sum(m => m.NewCustomersPerMonth.For(@case));
        var fromPrice = price?.DemandChangePerMonth.For(@case) ?? 0m;

        return Math.Max(0m, baseline.VisitsPerMonth + fromHires + fromMarketing + fromPrice);
    }
}
