using ExcentOne.Linq.Extensions;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.Persistence.Features.Models;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Linq.Expressions;

namespace ExcentOne.Application.Features.Commands;

public abstract class DeleteEntityHandler<TDbContext, TEntity, TKey, TRequest> :
    DbCommandHandler<TDbContext, TEntity, TRequest, Unit>
    where TDbContext : DbContext
    where TEntity : class, IEntity<TKey>
    where TKey : notnull, IEquatable<TKey>
    where TRequest : IDeleteEntity<TKey>
{
    protected DeleteEntityHandler(TDbContext dbContext) : base(dbContext)
    {
    }

    protected virtual bool ThrowIfEntityNotFound => true;

    public override async Task<Unit> Handle(TRequest request, CancellationToken cancellationToken)
    {
        var entities = Entities.AsExpandable();
        var predicate = ComposeFilter(PredicateBuilder.New<TEntity>(), request);

        var entity = await entities.FirstOrDefaultAsync(predicate, cancellationToken);
        if (entity is null)
        {
            var exception = new KeyNotFoundException($"{typeof(TEntity).Name} with Id of {request.Id} was not found.");

            if (ThrowIfEntityNotFound)
            {
                throw exception;
            }
            else
            {
                return await OnCommandFailedAsync(new(request, entity!, exception), cancellationToken);
            }
        }

        var entry = Entities.Remove(entity);
        OnEntityDetached(entry);

        return await SaveChangesAsync(request, entity, cancellationToken);
    }

    protected override Expression<Func<TEntity, bool>> ComposeFilter(Expression<Func<TEntity, bool>> predicate, TRequest request)
    {
        return predicate.Eq(e => e.Id, request.Id);
    }

    protected virtual void OnEntityDetached(EntityEntry<TEntity> entry)
    {

    }

    protected override Unit OnCommandSuccess(DbCommandSuccessArgs<TRequest, TEntity> args) => Unit.Value;
}