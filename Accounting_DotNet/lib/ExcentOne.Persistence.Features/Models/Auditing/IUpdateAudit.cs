namespace ExcentOne.Persistence.Features.Models.Auditing;

public interface IUpdateAudit
{
    string? UpdatedBy { get; }
    DateTime? UpdatedDate { get; }
}
