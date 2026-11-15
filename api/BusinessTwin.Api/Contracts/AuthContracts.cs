namespace BusinessTwin.Api.Contracts;

/// <summary>A browser signed in to the owner's account. <see cref="IsCurrent"/> marks the one making the request.</summary>
public record SessionDto(Guid Id, string Device, DateTimeOffset SignedInAt, DateTimeOffset LastSeenAt, bool IsCurrent);
