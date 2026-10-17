using BaselineEntity = BusinessTwin.Api.Data.Baseline;

namespace BusinessTwin.Api.Contracts;

/// <summary>Converts stored inputs into scenario engine inputs. The engine never sees EF entities.</summary>
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
}
