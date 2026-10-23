using BusinessTwin.Api.Data;
using BaselineEntity = BusinessTwin.Api.Data.Baseline;

namespace BusinessTwin.Api.Contracts;

/// <summary>
/// Converts between API contracts, stored rows and scenario engine inputs. The engine never sees EF entities.
/// Certain change parameters are stored in <c>changes.parameters</c> (jsonb), uncertain ones as rows in <c>estimates</c>.
/// </summary>
public static class EngineMapping
{
    public static Engine.Baseline ToEngine(BaselineEntity b) => new(
        VisitsPerMonth: b.VisitsPerMonth,
        AveragePrice: b.AveragePrice,
        CostPerService: b.CostPerService,
        StaffHoursPerMonth: b.StaffHoursPerMonth,
        ServiceTimeHours: b.ServiceTimeHours,
        WagesPerMonth: b.WagesPerMonth,
        OtherFixedCostsPerMonth: b.OtherFixedCostsPerMonth,
        CashOnHand: b.CashOnHand);

    /// <summary>Call only with a validated <see cref="ChangeDto"/>: the fields of its type are present.</summary>
    public static Engine.Change ToEngine(ChangeDto c) => c.Type switch
    {
        ChangeType.Hire => new Engine.HireChange(
            c.StartMonth, c.HoursPerMonth!.Value, c.EmployerCostPerMonth!.Value,
            ToEngine(c.CustomersPerMonth!), PercentToShare(c.NewCustomerSharePercent!), c.RampUpMonths ?? 1),
        ChangeType.Price => new Engine.PriceChange(c.StartMonth, c.NewPrice!.Value, ToEngine(c.DemandChangePercent!)),
        ChangeType.Marketing => new Engine.MarketingChange(c.StartMonth, c.CostPerMonth!.Value, ToEngine(c.NewCustomersPerMonth!)),
        _ => throw new ArgumentOutOfRangeException(nameof(c), c.Type, "Unknown change type."),
    };

    private static Engine.Estimate ToEngine(EstimateDto e) => new(e.Pessimistic, e.Expected, e.Optimistic);

    // Owners enter the share of new customers as a percentage; the engine works with a fraction.
    private static Engine.Estimate PercentToShare(EstimateDto e) => new(e.Pessimistic / 100m, e.Expected / 100m, e.Optimistic / 100m);

    public static ScenarioChange ToEntity(ChangeDto c)
    {
        var parameters = new Dictionary<string, decimal>();
        void Put(string key, decimal? value) { if (value is { } v) parameters[key] = v; }
        Put("hoursPerMonth", c.HoursPerMonth);
        Put("employerCostPerMonth", c.EmployerCostPerMonth);
        Put("rampUpMonths", c.RampUpMonths);
        Put("newPrice", c.NewPrice);
        Put("costPerMonth", c.CostPerMonth);

        var estimates = new List<ChangeEstimate>();
        void Add(string field, EstimateDto? e)
        {
            if (e is not null)
                estimates.Add(new ChangeEstimate { Field = field, Pessimistic = e.Pessimistic, Expected = e.Expected, Optimistic = e.Optimistic });
        }
        Add("customersPerMonth", c.CustomersPerMonth);
        Add("newCustomerSharePercent", c.NewCustomerSharePercent);
        Add("demandChangePercent", c.DemandChangePercent);
        Add("newCustomersPerMonth", c.NewCustomersPerMonth);

        return new ScenarioChange { Type = c.Type, StartMonth = c.StartMonth, Parameters = parameters, Estimates = estimates };
    }

    public static ChangeDto ToDto(ScenarioChange c)
    {
        decimal? Get(string key) => c.Parameters.TryGetValue(key, out var v) ? v : null;
        EstimateDto? Est(string field) =>
            c.Estimates.FirstOrDefault(e => e.Field == field) is { } e ? new(e.Pessimistic, e.Expected, e.Optimistic) : null;

        return new ChangeDto(
            c.Type, c.StartMonth,
            HoursPerMonth: Get("hoursPerMonth"),
            EmployerCostPerMonth: Get("employerCostPerMonth"),
            // Stored in the decimal parameters map; it is always written from an int, so the cast is exact.
            RampUpMonths: Get("rampUpMonths") is { } r ? decimal.ToInt32(r) : null,
            CustomersPerMonth: Est("customersPerMonth"),
            NewCustomerSharePercent: Est("newCustomerSharePercent"),
            NewPrice: Get("newPrice"),
            DemandChangePercent: Est("demandChangePercent"),
            CostPerMonth: Get("costPerMonth"),
            NewCustomersPerMonth: Est("newCustomersPerMonth"));
    }

    public static ScenarioDto ToDto(Scenario s) => new(
        s.Id, s.Name, s.HorizonMonths, s.Status, s.CreatedAt,
        s.Changes.OrderBy(c => c.StartMonth).ThenBy(c => c.Id).Select(ToDto).ToList());
}
