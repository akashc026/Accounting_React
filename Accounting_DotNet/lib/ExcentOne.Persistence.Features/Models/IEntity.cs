namespace ExcentOne.Persistence.Features.Models;

public interface IEntity
{
    string Id { get; }
}

public interface IEntity<TKey> : IEntity 
    where TKey : notnull, IEquatable<TKey>
{
    new TKey Id { get; }
    string IEntity.Id => Convert.ToString(Id)!;
}
