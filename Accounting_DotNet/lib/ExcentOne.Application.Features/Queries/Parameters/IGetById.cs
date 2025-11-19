namespace ExcentOne.Application.Features.Queries.Parameters;

public interface IGetById<out TKey> where TKey : notnull, IEquatable<TKey>
{
    TKey Id { get; }
}
