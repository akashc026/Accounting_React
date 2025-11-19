namespace ExcentOne.EntityFrameworkCore.Abstractions.Auditing;

public interface IUpdatable
{
    string? UpdatedBy { get; }
    DateTime? UpdatedDate { get; }
}
