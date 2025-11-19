using ExcentOne.Persistence.Features.Models;
using Microsoft.EntityFrameworkCore;

namespace ExcentOne.MediatR.EntityFrameworkCore.Query;

public abstract class DbQueryHandler<TDbContext, TEntity, TRequest, TResult, TResponse>(TDbContext dbContext) :
    DbOperationHandler<TDbContext, TEntity, TRequest, TResponse>(dbContext)
    where TDbContext : DbContext
    where TEntity : class, IEntity
    where TRequest : IDbQuery<TResponse>
{
    protected virtual async Task<TResponse> ExecuteQueryAsync(Func<TRequest, CancellationToken, Task<DbQuerySuccessArgs<TRequest, TResult>>> query, TRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var args = await query(request, cancellationToken);
            return await OnQuerySuccessAsync(args, cancellationToken);
        }
        catch (Exception ex)
        {
            DbQueryFailedArgs<TRequest> args = new(request, ex);
            await OnQueryFailedAsync(args, cancellationToken);
            throw;
        }
    }

    protected virtual TResponse OnQuerySuccess(DbQuerySuccessArgs<TRequest, TResult> args)
    {
        return default!;
    } 

    protected virtual Task<TResponse> OnQuerySuccessAsync(DbQuerySuccessArgs<TRequest, TResult> args, CancellationToken cancellationToken = default)
    {
        var response = OnQuerySuccess(args);
        return Task.FromResult(response);
    }

    protected virtual void OnQueryFailed(DbQueryFailedArgs<TRequest> args)
    {
        //Override inside the derived class (if needed).
    }

    protected virtual Task OnQueryFailedAsync(DbQueryFailedArgs<TRequest> args, CancellationToken cancellationToken = default)
    {
        OnQueryFailed(args);
        return Task.CompletedTask;
    }
}
