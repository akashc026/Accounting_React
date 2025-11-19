using ExcentOne.Persistence.Features.Models;
using ExcentOne.Reflection.Extensions.Activator;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Collections.Concurrent;

namespace ExcentOne.EntityFrameworkCore.Publishing;

public class EntityChangesNotificationPublisherInterceptor(IMediator mediator) : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        if (eventData.Context is { } context)
        {
            var entries = context.ChangeTracker.Entries<IEntity>();
            NotificationQueue.FromEntries(entries);
        }
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        if (eventData.Context is { } context)
        {
            var entries = context.ChangeTracker.Entries<IEntity>();
            NotificationQueue.FromEntries(entries);
        }
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        var changes = base.SavedChanges(eventData, result);
        if (changes > 0)
        {
            NotificationQueue.PublishAsync(mediator).Wait();
        }
        return changes;
    }

    public override async ValueTask<int> SavedChangesAsync(SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
    {
        var changes = await base.SavedChangesAsync(eventData, result, cancellationToken);
        if (changes > 0)
        {
            await NotificationQueue.PublishAsync(mediator, cancellationToken);
        }
        return changes;
    }

    public override void SaveChangesCanceled(DbContextEventData eventData)
    {
        NotificationQueue.Clear();
        base.SaveChangesCanceled(eventData);
    }

    public override Task SaveChangesCanceledAsync(DbContextEventData eventData, CancellationToken cancellationToken = default)
    {
        NotificationQueue.Clear();
        return base.SaveChangesCanceledAsync(eventData, cancellationToken);
    }

    public override void SaveChangesFailed(DbContextErrorEventData eventData)
    {
        NotificationQueue.Clear();
        base.SaveChangesFailed(eventData);
    }

    public override Task SaveChangesFailedAsync(DbContextErrorEventData eventData, CancellationToken cancellationToken = default)
    {
        NotificationQueue.Clear();
        return base.SaveChangesFailedAsync(eventData, cancellationToken);
    }

    static class NotificationQueue
    {
        private static ConcurrentQueue<EntityChangedNotification> queue = new();
        private static readonly EntityState[] StatesOfInterest =
        [
            EntityState.Added,
            EntityState.Modified,
            EntityState.Deleted
        ];

        public static void FromEntries(IEnumerable<EntityEntry<IEntity>> entityEntries)
        {
            queue = entityEntries
               .Where(entry => StatesOfInterest.Contains(entry.State))
               .Aggregate(queue, static (q, e) =>
               {
                   var entityType = e.Entity.GetType();
                   var previousState = e.OriginalValues.ToObject() as IEntity;
                   var currentState = e.CurrentValues.ToObject() as IEntity;
                   var notificationType = typeof(EntityChangedNotification<>).MakeGenericType(entityType);
                   var notification = ObjectFactory.Create<EntityChangedNotification>
                        (notificationType, e.State, currentState!, previousState!);
                   q.Enqueue(notification);
                   return q;
               });
        }

        public static async Task PublishAsync(IMediator mediator, CancellationToken cancellationToken = default)
        {
            do
            {
                try
                {
                    if (queue.TryDequeue(out var notification))
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        await mediator.Publish(notification, cancellationToken);
                    }
                }
                catch (OperationCanceledException)
                {
                    Clear();
                    break;
                }

            } while (!queue.IsEmpty);
        }

        public static void Clear() => queue.Clear();
    }
}
