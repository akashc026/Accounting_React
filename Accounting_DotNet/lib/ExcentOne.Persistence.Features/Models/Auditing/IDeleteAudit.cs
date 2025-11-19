namespace ExcentOne.Persistence.Features.Models.Auditing;

public interface IDeleteAudit
{
    bool IsDeleted { get; }
    string? DeletedBy { get; }
    DateTime? DeletedDate { get; }
}
