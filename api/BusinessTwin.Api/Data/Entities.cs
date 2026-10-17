using Microsoft.AspNetCore.Identity;

namespace BusinessTwin.Api.Data;

// The database stores inputs only. Results are always recalculated by the scenario engine.

public class AppUser : IdentityUser;

public enum SourceLabel
{
    Entered,
    Estimated,
    Sample,
}

public enum ScenarioStatus
{
    Draft,
    Saved,
}

public enum ChangeType
{
    Hire,
    Price,
    Marketing,
}

public class Business
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string OwnerId { get; set; }
    public AppUser? Owner { get; set; }
    public required string Name { get; set; }
    public string BusinessType { get; set; } = "salon";
    public int StaffCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Baseline? Baseline { get; set; }
}

/// <summary>Today's monthly picture of the business. One per business in the PoC.</summary>
public class Baseline
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid BusinessId { get; set; }
    public Business? Business { get; set; }

    public decimal VisitsPerMonth { get; set; }
    public decimal AveragePrice { get; set; }
    public decimal CostPerService { get; set; }
    public decimal StaffHoursPerMonth { get; set; }
    public decimal ServiceTimeHours { get; set; }
    public decimal WagesPerMonth { get; set; }
    public decimal OtherFixedCostsPerMonth { get; set; }
    public decimal CashOnHand { get; set; }

    /// <summary>Source label per field name (camelCase), e.g. "averagePrice" → Entered.</summary>
    public Dictionary<string, SourceLabel> InputSources { get; set; } = [];

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<Scenario> Scenarios { get; set; } = [];
}

/// <summary>A named what-if on a baseline.</summary>
public class Scenario
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid BaselineId { get; set; }
    public Baseline? Baseline { get; set; }
    public required string Name { get; set; }
    public int HorizonMonths { get; set; } = 12;
    public ScenarioStatus Status { get; set; } = ScenarioStatus.Draft;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<ScenarioChange> Changes { get; set; } = [];
}

/// <summary>
/// One change in a scenario (table "changes"). Certain, type-specific parameters live in
/// <see cref="Parameters"/> as jsonb so new change types need no new table.
/// </summary>
public class ScenarioChange
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid ScenarioId { get; set; }
    public Scenario? Scenario { get; set; }
    public ChangeType Type { get; set; }
    public int StartMonth { get; set; }
    public Dictionary<string, decimal> Parameters { get; set; } = [];

    public List<ChangeEstimate> Estimates { get; set; } = [];
}

/// <summary>Pessimistic, expected and optimistic value of one uncertain field of a change (table "estimates").</summary>
public class ChangeEstimate
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid ChangeId { get; set; }
    public ScenarioChange? Change { get; set; }
    public required string Field { get; set; }
    public decimal Pessimistic { get; set; }
    public decimal Expected { get; set; }
    public decimal Optimistic { get; set; }
}
