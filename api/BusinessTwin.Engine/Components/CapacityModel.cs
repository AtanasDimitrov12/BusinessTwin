namespace BusinessTwin.Engine.Components;

/// <summary>How many visits the team can deliver in a month.</summary>
internal static class CapacityModel
{
    public static decimal Capacity(decimal staffHours, decimal serviceTimeHours) => staffHours / serviceTimeHours;
}
