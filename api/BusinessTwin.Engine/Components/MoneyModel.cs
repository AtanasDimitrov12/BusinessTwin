namespace BusinessTwin.Engine.Components;

internal sealed record MonthMoney(
    decimal ServicesDelivered,
    decimal Revenue,
    decimal VariableCosts,
    decimal Contribution,
    decimal FixedCosts,
    decimal MonthlyResult);

/// <summary>Revenue, costs and monthly result for one month. Services delivered = min(demand, capacity).</summary>
internal static class MoneyModel
{
    public static MonthMoney Calculate(MonthPlan plan, decimal capacity, decimal costPerService, decimal otherFixedCosts)
    {
        var delivered = Math.Min(plan.Demand, capacity);
        var revenue = delivered * plan.AveragePrice;
        var variableCosts = delivered * costPerService;
        var contribution = revenue - variableCosts;
        var fixedCosts = plan.Wages + otherFixedCosts + plan.MarketingSpend;

        return new MonthMoney(delivered, revenue, variableCosts, contribution, fixedCosts, contribution - fixedCosts);
    }
}
