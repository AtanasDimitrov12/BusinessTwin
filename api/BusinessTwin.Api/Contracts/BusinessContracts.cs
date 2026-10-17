using System.ComponentModel.DataAnnotations;
using BusinessTwin.Api.Data;
using BusinessTwin.Api.Infrastructure;

namespace BusinessTwin.Api.Contracts;

public record BusinessDto(Guid Id, string Name, string BusinessType, int StaffCount, bool HasBaseline);

public record SaveBusinessRequest(
    [Required, StringLength(100, MinimumLength = 1)] string Name,
    [Range(1, 50)] int StaffCount);

/// <summary>The baseline as the owner enters it. Money in euros, sent as decimal strings.</summary>
public record BaselineInput(
    [DecimalRange(0, 100_000)] decimal VisitsPerMonth,
    [DecimalRange(0, 10_000)] decimal AveragePrice,
    [DecimalRange(0, 10_000)] decimal CostPerService,
    [DecimalRange(0, 100_000)] decimal StaffHoursPerMonth,
    [DecimalRange(0.05, 24)] decimal ServiceTimeHours,
    [DecimalRange(0, 10_000_000)] decimal WagesPerMonth,
    [DecimalRange(0, 10_000_000)] decimal OtherFixedCostsPerMonth,
    [DecimalRange(-10_000_000, 10_000_000)] decimal CashOnHand,
    Dictionary<string, SourceLabel> Sources)
{
    /// <summary>Field names that carry a source label, as used in <see cref="Sources"/>.</summary>
    public static readonly string[] FieldNames =
    [
        "visitsPerMonth", "averagePrice", "costPerService", "staffHoursPerMonth",
        "serviceTimeHours", "wagesPerMonth", "otherFixedCostsPerMonth", "cashOnHand",
    ];
}

public record BaselineDto(
    decimal VisitsPerMonth,
    decimal AveragePrice,
    decimal CostPerService,
    decimal StaffHoursPerMonth,
    decimal ServiceTimeHours,
    decimal WagesPerMonth,
    decimal OtherFixedCostsPerMonth,
    decimal CashOnHand,
    Dictionary<string, SourceLabel> Sources,
    DateTimeOffset UpdatedAt);

/// <summary>One month of the baseline as calculated by the engine. Every value here is labelled "calculated".</summary>
public record BaselineSummaryDto(
    decimal Capacity,
    decimal ServicesDelivered,
    decimal UnservedDemand,
    decimal UnusedCapacity,
    decimal Utilisation,
    decimal Revenue,
    decimal VariableCosts,
    decimal Contribution,
    decimal FixedCosts,
    decimal MonthlyResult,
    decimal CashAfterOneMonth);
