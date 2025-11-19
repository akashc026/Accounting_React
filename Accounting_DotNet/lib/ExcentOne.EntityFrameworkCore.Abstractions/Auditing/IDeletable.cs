namespace ExcentOne.EntityFrameworkCore.Abstractions.Auditing;

public interface IDeletable
{
    bool IsDeleted { get; }
    string? DeletedBy { get; }
    DateTime? DeletedDate { get; }
}
