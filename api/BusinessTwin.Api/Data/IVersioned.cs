namespace BusinessTwin.Api.Data;

/// <summary>
/// A row the owner can edit from more than one device or tab. <see cref="Version"/> is an EF Core concurrency
/// token: every save sends the version the client loaded, and the save fails if someone saved in between
/// (optimistic concurrency, see docs/architecture.md).
/// </summary>
public interface IVersioned
{
    int Version { get; set; }
}
