using ExcentOne.Persistence.Features.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace ExcentOne.MediatR.EntityFrameworkCore.Command;

public abstract class DbCommandHandler<TDbContext, TEntity, TRequest, TResponse>(TDbContext dbContext) :
    DbOperationHandler<TDbContext, TEntity, TRequest, TResponse>(dbContext)
    where TDbContext : DbContext
    where TEntity : class, IEntity
    where TRequest : IDbCommand<TResponse>
{
    protected virtual void OnEntityTracked(TRequest request, EntityEntry<TEntity> entry)
    {
    }

    protected virtual async Task<TResponse> SaveChangesAsync(TRequest request, TEntity entity, CancellationToken cancellationToken = default)
    {
        try
        {
            await DbContext.SaveChangesAsync(cancellationToken);
            return await OnCommandSuccessAsync(new(request, entity), cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            DbCommandFailedArgs<TRequest, TEntity> args = new(request, entity, ex);
            TResponse response = await OnCommandFailedAsync(args, cancellationToken);
            if (!args.IsExceptionHandled)
            {
                throw;
            }
            return response;
        }
    }

    protected virtual TResponse OnCommandFailed(DbCommandFailedArgs<TRequest, TEntity> args)
    {
        return default!;
    }

    protected virtual Task<TResponse> OnCommandFailedAsync(DbCommandFailedArgs<TRequest, TEntity> args, CancellationToken cancellationToken = default)
    {
        var response = OnCommandFailed(args);
        return Task.FromResult(response);
    }

    protected virtual TResponse OnCommandSuccess(DbCommandSuccessArgs<TRequest, TEntity> args)
    {
        return default!;
    }

    protected virtual Task<TResponse> OnCommandSuccessAsync(DbCommandSuccessArgs<TRequest, TEntity> args, CancellationToken cancellationToken = default)
    {
        var response = OnCommandSuccess(args);
        return Task.FromResult(response);
    }
}
