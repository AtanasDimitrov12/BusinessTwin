namespace BusinessTwin.Engine;

/// <summary>The three cases the model runs once each.</summary>
public enum Case
{
    Pessimistic,
    Expected,
    Optimistic,
}

/// <summary>An uncertain estimate: one value per case.</summary>
public sealed record Estimate(decimal Pessimistic, decimal Expected, decimal Optimistic)
{
    public static Estimate Certain(decimal value) => new(value, value, value);

    public decimal For(Case @case) => @case switch
    {
        Case.Pessimistic => Pessimistic,
        Case.Expected => Expected,
        Case.Optimistic => Optimistic,
        _ => throw new ArgumentOutOfRangeException(nameof(@case)),
    };
}

/// <summary>Today's monthly picture of the business. Money in euros.</summary>
public sealed record Baseline(
    decimal VisitsPerMonth,
    decimal AveragePrice,
    decimal CostPerService,
    decimal StaffHoursPerMonth,
    decimal ServiceTimeHours,
    decimal WagesPerMonth,
    decimal OtherFixedCostsPerMonth,
    decimal CashOnHand);

/// <summary>One change in a scenario. Months are 1-based; a change applies from its start month on.</summary>
public abstract record Change(int StartMonth)
{
    public bool IsActiveIn(int month) => month >= StartMonth;
}

/// <summary>
/// Hire a worker. Adds capacity (hours) and a fixed cost. Only the share of the worker's
/// customers that is new adds demand; moved customers shift work between staff.
/// </summary>
public sealed record HireChange(
    int StartMonth,
    decimal HoursPerMonth,
    decimal EmployerCostPerMonth,
    Estimate CustomersPerMonth,
    Estimate NewCustomerShare) : Change(StartMonth);

/// <summary>Change the average price. Demand change is in visits per month (negative for a drop).</summary>
public sealed record PriceChange(
    int StartMonth,
    decimal NewPrice,
    Estimate DemandChangePerMonth) : Change(StartMonth);

/// <summary>Spend more on marketing. Adds demand and a monthly cost, no capacity.</summary>
public sealed record MarketingChange(
    int StartMonth,
    decimal CostPerMonth,
    Estimate NewCustomersPerMonth) : Change(StartMonth);

public sealed record ScenarioInput(Baseline Baseline, IReadOnlyList<Change> Changes, int HorizonMonths);
