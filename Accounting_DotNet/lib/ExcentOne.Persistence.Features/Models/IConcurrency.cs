namespace ExcentOne.Persistence.Features.Models;

public interface IConcurrency
{
    byte[] Timestamp { get; }
}
