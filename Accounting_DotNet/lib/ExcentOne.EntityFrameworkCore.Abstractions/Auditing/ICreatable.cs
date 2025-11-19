namespace ExcentOne.EntityFrameworkCore.Abstractions.Auditing;

public interface ICreatable
{
    string CreatedBy { get; }
    DateTime CreatedDate { get; }
}
