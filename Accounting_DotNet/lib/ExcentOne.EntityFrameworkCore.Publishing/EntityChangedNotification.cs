using ExcentOne.Persistence.Features.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ExcentOne.EntityFrameworkCore.Publishing;

public enum EventType
{
    Create,
    Update,
    Delete,
    Unknown
}

public class EntityChangedNotification<TEntity>(EntityState entityState, TEntity current, TEntity? original) : EntityChangedNotification(entityState, current, original), INotification
    where TEntity : IEntity
{
}

public class EntityChangedNotification(EntityState entityState, IEntity current, IEntity? original) : EventArgs, INotification
{
    public string EntityID => current.Id;
    public IEntity? OriginalValues => original;
    public IEntity CurrentValues => current;
    public EventType EventType => entityState switch
    {
        EntityState.Added => EventType.Create,
        EntityState.Modified => EventType.Update,
        EntityState.Deleted => EventType.Delete,
        _ => EventType.Unknown
    };

    public override int GetHashCode()
    {
        HashCode hc = new ();
        hc.Add(EntityID);
        hc.Add(EventType);
        return hc.ToHashCode();
    }
}
