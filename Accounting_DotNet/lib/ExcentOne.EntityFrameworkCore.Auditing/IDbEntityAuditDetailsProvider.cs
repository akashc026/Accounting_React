namespace ExcentOne.EntityFrameworkCore.Auditing;

public sealed record AuditDetails(string UserId, DateTime Timestamp);

public interface IDbEntityAuditDetailsProvider
{
    AuditDetails AuditDetails { get; }
}
