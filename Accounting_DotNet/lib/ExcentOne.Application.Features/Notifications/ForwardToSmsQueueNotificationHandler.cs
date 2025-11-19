using ExcentOne.EntityFrameworkCore.Publishing;
using ExcentOne.Persistence.Features.Models;
using MediatR;

namespace ExcentOne.Application.Features.Notifications;

public abstract class ForwardToSmsQueueNotificationHandler<TEntity> : INotificationHandler<EntityChangedNotification<TEntity>>
    where TEntity : notnull, IEntity
{
    public abstract Task Handle(EntityChangedNotification<TEntity> notification, CancellationToken cancellationToken);
}
