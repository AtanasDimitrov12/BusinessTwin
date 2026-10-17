using System.ComponentModel.DataAnnotations;
using BusinessTwin.Api.Data;
using BusinessTwin.Api.Infrastructure;
using BusinessTwin.Engine;

namespace BusinessTwin.Api.Contracts;

/// <summary>Pessimistic, expected and optimistic value of an uncertain estimate. Higher is better for every estimate.</summary>
public record EstimateDto(decimal Pessimistic, decimal Expected, decimal Optimistic);

/// <summary>
/// One change in a scenario. Flat on purpose (simple OpenAPI and TypeScript types): only the fields of
/// <see cref="Type"/> are used, the others stay null.
/// </summary>
public record ChangeDto(
    ChangeType Type,
    int StartMonth,
    // Hire
    decimal? HoursPerMonth = null,
    decimal? EmployerCostPerMonth = null,
    int? RampUpMonths = null,
    EstimateDto? CustomersPerMonth = null,
    EstimateDto? NewCustomerSharePercent = null,
    // Price
    decimal? NewPrice = null,
    EstimateDto? DemandChangePercent = null,
    // Marketing
    decimal? CostPerMonth = null,
    EstimateDto? NewCustomersPerMonth = null) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var errors = new List<ValidationResult>();
        void Require(object? value, string name)
        {
            if (value is null) errors.Add(new($"{name} is required for a {Type} change.", [name]));
        }
        void Range(decimal? value, decimal min, decimal max, string name)
        {
            if (value is { } v && (v < min || v > max)) errors.Add(new($"{name} must be between {min} and {max}.", [name]));
        }
        void Estimate(EstimateDto? e, decimal min, decimal max, string name)
        {
            if (e is null) return;
            Range(e.Pessimistic, min, max, $"{name}.Pessimistic");
            Range(e.Expected, min, max, $"{name}.Expected");
            Range(e.Optimistic, min, max, $"{name}.Optimistic");
            if (e.Pessimistic > e.Expected || e.Expected > e.Optimistic)
                errors.Add(new($"{name}: pessimistic ≤ expected ≤ optimistic.", [name]));
        }

        if (StartMonth < 1) errors.Add(new("StartMonth must be at least 1.", [nameof(StartMonth)]));

        switch (Type)
        {
            case ChangeType.Hire:
                Require(HoursPerMonth, nameof(HoursPerMonth));
                Require(EmployerCostPerMonth, nameof(EmployerCostPerMonth));
                Require(CustomersPerMonth, nameof(CustomersPerMonth));
                Require(NewCustomerSharePercent, nameof(NewCustomerSharePercent));
                Range(HoursPerMonth, 1, 400, nameof(HoursPerMonth));
                Range(EmployerCostPerMonth, 0, 100_000, nameof(EmployerCostPerMonth));
                Range(RampUpMonths, 1, 12, nameof(RampUpMonths));
                Estimate(CustomersPerMonth, 0, 10_000, nameof(CustomersPerMonth));
                Estimate(NewCustomerSharePercent, 0, 100, nameof(NewCustomerSharePercent));
                break;
            case ChangeType.Price:
                Require(NewPrice, nameof(NewPrice));
                Require(DemandChangePercent, nameof(DemandChangePercent));
                Range(NewPrice, 0, 10_000, nameof(NewPrice));
                Estimate(DemandChangePercent, -100, 100, nameof(DemandChangePercent));
                break;
            case ChangeType.Marketing:
                Require(CostPerMonth, nameof(CostPerMonth));
                Require(NewCustomersPerMonth, nameof(NewCustomersPerMonth));
                Range(CostPerMonth, 0, 100_000, nameof(CostPerMonth));
                Estimate(NewCustomersPerMonth, 0, 10_000, nameof(NewCustomersPerMonth));
                break;
        }
        return errors;
    }
}

public record ScenarioDto(
    Guid Id,
    string Name,
    int HorizonMonths,
    ScenarioStatus Status,
    DateTimeOffset CreatedAt,
    IReadOnlyList<ChangeDto> Changes);

public record SaveScenarioRequest(
    [Required, StringLength(100, MinimumLength = 1)] string Name,
    [Range(1, ScenarioEngine.MaxHorizonMonths)] int HorizonMonths,
    [Required, MinLength(1), MaxLength(10)] IReadOnlyList<ChangeDto> Changes,
    ScenarioStatus Status = ScenarioStatus.Saved);

/// <summary>Run changes against the owner's baseline without saving them (live preview in the scenario builder).</summary>
public record SimulateRequest(
    [Range(1, ScenarioEngine.MaxHorizonMonths)] int HorizonMonths,
    [Required, MinLength(1), MaxLength(10)] IReadOnlyList<ChangeDto> Changes);

// ── Results (always recalculated, never stored) ──────────────────────────────

public record MonthResultDto(
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

/// <summary>Totals over the horizon for one run.</summary>
public record RunSummaryDto(
    decimal TotalServed,
    decimal TotalUnserved,
    decimal TotalRevenue,
    decimal TotalFixedCosts,
    decimal TotalResult,
    decimal AverageMonthlyResult,
    decimal EndCash,
    decimal LowestCash,
    int LowestCashMonth,
    decimal LastMonthUtilisation);

/// <summary>Scenario minus baseline, calculated on the server so the browser never subtracts money.</summary>
public record SummaryDifferenceDto(
    decimal TotalServed,
    decimal TotalRevenue,
    decimal TotalFixedCosts,
    decimal TotalResult,
    decimal AverageMonthlyResult,
    decimal EndCash);

public record DriversDto(
    decimal ExtraVisitsContribution,
    decimal PriceEffect,
    decimal AddedWageCosts,
    decimal MarketingCosts,
    decimal TotalDifference,
    decimal RevenueLostToUnservedDemand,
    decimal? BreakEvenNewVisitsPerMonth,
    int? BreakEvenMonth,
    decimal CumulativeGap);

/// <summary>One bar of the driver waterfall: it spans from <see cref="Low"/> to <see cref="High"/>.</summary>
public record WaterfallStepDto(string Key, decimal Amount, decimal Low, decimal High);

public record CaseResultDto(
    Case Case,
    IReadOnlyList<MonthResultDto> Months,
    IReadOnlyList<decimal> ResultDifferenceByMonth,
    IReadOnlyList<decimal> CumulativeGapByMonth,
    IReadOnlyList<int> ShortfallMonths,
    RunSummaryDto Summary,
    SummaryDifferenceDto Difference,
    DriversDto Drivers,
    IReadOnlyList<WaterfallStepDto> Waterfall);

public record SimulationResultDto(
    int HorizonMonths,
    IReadOnlyList<MonthResultDto> Baseline,
    RunSummaryDto BaselineSummary,
    IReadOnlyList<CaseResultDto> Cases);
