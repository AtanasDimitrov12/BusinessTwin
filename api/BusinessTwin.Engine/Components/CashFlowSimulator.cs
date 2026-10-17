namespace BusinessTwin.Engine.Components;

/// <summary>Runs the months in order, carrying cash forward and flagging every month that ends below zero.</summary>
internal static class CashFlowSimulator
{
    public static IReadOnlyList<MonthResult> Run(Baseline baseline, int horizonMonths, Func<int, MonthPlan> planForMonth)
    {
        var months = new List<MonthResult>(horizonMonths);
        var cash = baseline.CashOnHand;

        for (var month = 1; month <= horizonMonths; month++)
        {
            var plan = planForMonth(month);
            var capacity = CapacityModel.Capacity(plan.StaffHours, baseline.ServiceTimeHours);
            var money = MoneyModel.Calculate(plan, capacity, baseline.CostPerService, baseline.OtherFixedCostsPerMonth);
            cash += money.MonthlyResult;

            months.Add(new MonthResult(
                Month: month,
                Demand: plan.Demand,
                Capacity: capacity,
                ServicesDelivered: money.ServicesDelivered,
                UnservedDemand: plan.Demand - money.ServicesDelivered,
                UnusedCapacity: capacity - money.ServicesDelivered,
                Utilisation: capacity == 0m ? 0m : money.ServicesDelivered / capacity,
                AveragePrice: plan.AveragePrice,
                Revenue: money.Revenue,
                VariableCosts: money.VariableCosts,
                Contribution: money.Contribution,
                FixedCosts: money.FixedCosts,
                MonthlyResult: money.MonthlyResult,
                CashAtEnd: cash,
                CashShortfall: cash < 0m));
        }

        return months;
    }
}
