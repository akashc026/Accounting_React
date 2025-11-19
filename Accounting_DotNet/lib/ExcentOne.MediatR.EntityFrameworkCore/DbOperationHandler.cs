using ExcentOne.Persistence.Features.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace ExcentOne.MediatR.EntityFrameworkCore;

public abstract class DbOperationHandler<TDbContext, TEntity, TRequest, TResponse> :
    IRequestHandler<TRequest, TResponse>
    where TDbContext : DbContext
    where TEntity : class, IEntity
    where TRequest : IDbOperation<TResponse>
{
    protected readonly TDbContext DbContext;

    protected DbOperationHandler(TDbContext dbContext)
    {
        ArgumentNullException.ThrowIfNull(dbContext);
        DbContext = dbContext;
    }

    protected DbSet<TEntity> Entities => DbContext.Set<TEntity>();
    public abstract Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken);
    protected abstract Expression<Func<TEntity, bool>> ComposeFilter(Expression<Func<TEntity, bool>> predicate, TRequest request);
}
