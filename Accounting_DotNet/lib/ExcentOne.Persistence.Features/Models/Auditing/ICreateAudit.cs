namespace ExcentOne.Persistence.Features.Models.Auditing;

public interface ICreateAudit
{
    string CreatedBy { get; }
    DateTime CreatedDate { get; }
}
