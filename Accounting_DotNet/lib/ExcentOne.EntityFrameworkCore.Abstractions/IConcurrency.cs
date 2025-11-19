namespace ExcentOne.EntityFrameworkCore.Abstractions;

public interface IConcurrency
{
    byte[] Timestamp { get; }
}
