namespace ExcentOne.EntityFrameworkCore.Abstractions;

public interface IEntity
{
    string ID { get; }
}

public interface IEntity<TKey> : IEntity 
    where TKey : notnull, IEquatable<TKey>
{
    new TKey ID { get; }
    string IEntity.ID => Convert.ToString(ID)!;
}
