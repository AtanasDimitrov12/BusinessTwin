namespace BusinessTwin.Engine.Tests;

/// <summary>
/// Hand-worked reference cases (fictional salon). Each expected value is worked out in the comment above it.
///
/// Reference salon, every month:
///   visits 400, price €40, cost per service €5  → contribution per visit €35
///   staff hours 480, service time 1 h           → capacity 480 slots, utilisation 400/480
///   revenue 400 × 40 = 16,000; variable 400 × 5 = 2,000; contribution 14,000
///   fixed: wages 8,000 + other 3,000 = 11,000   → monthly result 3,000
/// </summary>
public class ReferenceCaseTests
{
    private static readonly Baseline Salon = new(
        VisitsPerMonth: 400m,
        AveragePrice: 40m,
        CostPerService: 5m,
        StaffHoursPerMonth: 480m,
        ServiceTimeHours: 1m,
        WagesPerMonth: 8_000m,
        OtherFixedCostsPerMonth: 3_000m,
        CashOnHand: 2_000m);

    // Hire from month 1: 120 h, €3,500/month. Customers 30 / 50 / 60, share new 0.2 / 0.4 / 0.5.
    private static readonly HireChange Hire = new(
        StartMonth: 1,
        HoursPerMonth: 120m,
        EmployerCostPerMonth: 3_500m,
        CustomersPerMonth: new Estimate(30m, 50m, 60m),
        NewCustomerShare: new Estimate(0.2m, 0.4m, 0.5m));

    [Fact]
    public void Baseline_summary_matches_hand_calculation()
    {
        var m = ScenarioEngine.SummariseBaseline(Salon);

        Assert.Equal(480m, m.Capacity);
        Assert.Equal(400m, m.ServicesDelivered);
        Assert.Equal(80m, m.UnusedCapacity);
        Assert.Equal(16_000m, m.Revenue);
        Assert.Equal(14_000m, m.Contribution);
        Assert.Equal(11_000m, m.FixedCosts);
        Assert.Equal(3_000m, m.MonthlyResult);
        Assert.Equal(5_000m, m.CashAtEnd); // 2,000 + 3,000
    }

    [Fact]
    public void Baseline_cash_accumulates_month_by_month()
    {
        var result = ScenarioEngine.Simulate(new ScenarioInput(Salon, [], 3));

        Assert.Equal([5_000m, 8_000m, 11_000m], result.Baseline.Select(m => m.CashAtEnd));
    }

    [Fact]
    public void Hire_adds_only_new_customers_to_demand_and_its_hours_to_capacity()
    {
        var expected = ScenarioEngine.Simulate(new ScenarioInput(Salon, [Hire], 6)).For(Case.Expected);
        var m1 = expected.Months[0];

        // New visits 50 × 0.4 = 20 → demand 420. Capacity (480 + 120) / 1 = 600.
        Assert.Equal(420m, m1.Demand);
        Assert.Equal(600m, m1.Capacity);
        Assert.Equal(420m, m1.ServicesDelivered);
        Assert.Equal(180m, m1.UnusedCapacity);
        // Contribution 420 × 35 = 14,700. Fixed 11,000 + 3,500 = 14,500. Result 200.
        Assert.Equal(14_700m, m1.Contribution);
        Assert.Equal(14_500m, m1.FixedCosts);
        Assert.Equal(200m, m1.MonthlyResult);
        Assert.Equal(2_200m, m1.CashAtEnd);
    }

    [Fact]
    public void Hire_drivers_and_break_even()
    {
        var expected = ScenarioEngine.Simulate(new ScenarioInput(Salon, [Hire], 6)).For(Case.Expected);
        var d = expected.Drivers;

        // Per month: +20 visits × 35 = +700, wages −3,500 → gap −2,800. Six months: −16,800.
        Assert.Equal(4_200m, d.ExtraVisitsContribution);
        Assert.Equal(-21_000m, d.AddedWageCosts);
        Assert.Equal(-16_800m, d.TotalDifference);
        Assert.Equal(-16_800m, d.CumulativeGap);
        Assert.Equal([-2_800m, -5_600m, -8_400m, -11_200m, -14_000m, -16_800m], expected.CumulativeGapByMonth);
        // Needs 3,500 / 35 = 100 new visits a month to pay for itself; with 20 it never catches up.
        Assert.Equal(100m, d.BreakEvenNewVisitsPerMonth);
        Assert.Null(d.BreakEvenMonth);
    }

    [Fact]
    public void Each_case_uses_its_own_estimates()
    {
        var result = ScenarioEngine.Simulate(new ScenarioInput(Salon, [Hire], 1));

        // Pessimistic 30 × 0.2 = 6; expected 50 × 0.4 = 20; optimistic 60 × 0.5 = 30 new visits.
        Assert.Equal(406m, result.For(Case.Pessimistic).Months[0].Demand);
        Assert.Equal(420m, result.For(Case.Expected).Months[0].Demand);
        Assert.Equal(430m, result.For(Case.Optimistic).Months[0].Demand);
    }

    [Fact]
    public void Cash_shortfall_is_flagged_in_every_month_below_zero()
    {
        var lowCash = Salon with { CashOnHand = 500m };
        var pessimistic = ScenarioEngine.Simulate(new ScenarioInput(lowCash, [Hire], 3)).For(Case.Pessimistic);

        // Result 406 × 35 − 14,500 = −290 a month. Cash 210, −80, −370.
        Assert.Equal([210m, -80m, -370m], pessimistic.Months.Select(m => m.CashAtEnd));
        Assert.Equal([2, 3], pessimistic.ShortfallMonths);
    }

    [Fact]
    public void Marketing_demand_beyond_capacity_is_unserved()
    {
        var campaign = new MarketingChange(StartMonth: 1, CostPerMonth: 500m, NewCustomersPerMonth: Estimate.Certain(100m));
        var expected = ScenarioEngine.Simulate(new ScenarioInput(Salon, [campaign], 1)).For(Case.Expected);
        var m1 = expected.Months[0];

        // Demand 500 but capacity 480: 20 visits unserved, utilisation 100%.
        Assert.Equal(500m, m1.Demand);
        Assert.Equal(480m, m1.ServicesDelivered);
        Assert.Equal(20m, m1.UnservedDemand);
        Assert.Equal(1m, m1.Utilisation);
        // Contribution 480 × 35 = 16,800. Fixed 11,500. Result 5,300 → +2,300 vs baseline.
        Assert.Equal(5_300m, m1.MonthlyResult);
        Assert.Equal(2_800m, expected.Drivers.ExtraVisitsContribution); // 80 × 35
        Assert.Equal(-500m, expected.Drivers.MarketingCosts);
        Assert.Equal(2_300m, expected.Drivers.TotalDifference);
        Assert.Equal(800m, expected.Drivers.RevenueLostToUnservedDemand); // 20 × 40
        Assert.Equal(1, expected.Drivers.BreakEvenMonth);
    }

    [Fact]
    public void Price_change_applies_from_its_start_month()
    {
        // −5% of 400 baseline visits = −20 visits.
        var price = new PriceChange(StartMonth: 2, NewPrice: 44m, DemandChangePercent: Estimate.Certain(-5m));
        var expected = ScenarioEngine.Simulate(new ScenarioInput(Salon, [price], 2)).For(Case.Expected);

        // Month 1 unchanged. Month 2: 380 visits × (44 − 5) = 14,820 − 11,000 = 3,820 → +820.
        Assert.Equal(3_000m, expected.Months[0].MonthlyResult);
        Assert.Equal(3_820m, expected.Months[1].MonthlyResult);
        // Volume −20 × 35 = −700; price 380 × 4 = +1,520; total +820.
        Assert.Equal(-700m, expected.Drivers.ExtraVisitsContribution);
        Assert.Equal(1_520m, expected.Drivers.PriceEffect);
        Assert.Equal(820m, expected.Drivers.TotalDifference);
        Assert.Equal([0m, 820m], expected.CumulativeGapByMonth);
        Assert.Equal(2, expected.Drivers.BreakEvenMonth);
        Assert.Null(expected.Drivers.BreakEvenNewVisitsPerMonth); // no added fixed cost
    }

    [Fact]
    public void Driver_effects_add_up_to_the_total_difference_in_every_case()
    {
        var changes = new Change[]
        {
            Hire,
            new MarketingChange(2, 400m, new Estimate(10m, 40m, 90m)),
            new HireChange(4, 80m, 2_400m, new Estimate(20m, 40m, 60m), new Estimate(0.25m, 0.5m, 0.75m), RampUpMonths: 3),
            new PriceChange(3, 42.5m, new Estimate(-7.5m, -2.5m, 0m)),
        };
        var result = ScenarioEngine.Simulate(new ScenarioInput(Salon, changes, 12));

        foreach (var c in result.Cases)
        {
            var actualGap = c.Months.Zip(result.Baseline).Sum(p => p.First.MonthlyResult - p.Second.MonthlyResult);
            Assert.Equal(actualGap, c.Drivers.TotalDifference);
            Assert.Equal(actualGap, c.Drivers.CumulativeGap);
        }
    }

    [Fact]
    public void Hire_ramp_up_grows_new_customers_and_reaches_break_even()
    {
        // 125 customers at full speed, 80% new → 100 new visits, reached in 4 equal steps: 25, 50, 75, 100.
        var hire = Hire with { CustomersPerMonth = Estimate.Certain(125m), NewCustomerShare = Estimate.Certain(0.8m), RampUpMonths = 4 };
        var expected = ScenarioEngine.Simulate(new ScenarioInput(Salon, [hire], 5)).For(Case.Expected);

        Assert.Equal([425m, 450m, 475m, 500m, 500m], expected.Months.Select(m => m.Demand));
        // Gap per month: new visits × 35 − 3,500 → −2,625, −1,750, −875, 0, 0.
        Assert.Equal([-2_625m, -4_375m, -5_250m, -5_250m, -5_250m], expected.CumulativeGapByMonth);
        // Monthly result catches up with the baseline in month 4, but the business is still €5,250 behind in total.
        Assert.Equal(4, expected.Drivers.BreakEvenMonth);
        Assert.Equal(-5_250m, expected.Drivers.CumulativeGap);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(ScenarioEngine.MaxHorizonMonths + 1)]
    public void Horizon_outside_range_is_rejected(int horizon)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ScenarioEngine.Simulate(new ScenarioInput(Salon, [], horizon)));
    }
}
