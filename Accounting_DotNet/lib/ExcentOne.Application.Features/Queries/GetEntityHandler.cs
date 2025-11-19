using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using ExcentOne.Linq.Extensions;
using ExcentOne.Persistence.Features.Models;

namespace ExcentOne.Application.Features.Queries;

public abstract class GetEntityHandler<TDbContext, TEntity, TKey, TRequest, TResponse>(TDbContext dbContext, IMapper mapper) :
    DbQueryHandler<TDbContext, TEntity, TRequest, TEntity?, TResponse?>(dbContext)
    where TDbContext : DbContext
    where TKey : notnull, IEquatable<TKey>
    where TEntity : class, IEntity<TKey>
    where TRequest : IGetEntity<TKey, TResponse>
{
    protected readonly IMapper Mapper = mapper;
    public override async Task<TResponse?> Handle(TRequest request, CancellationToken cancellationToken)
        => await ExecuteQueryAsync(async (req, token) =>
            {
                var entities = Entities.AsExpandable();
                var predicate = ComposeFilter(PredicateBuilder.New<TEntity>(), request);
                var entity = await entities.FirstOrDefaultAsync(predicate, cancellationToken);
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);

    protected override Expression<Func<TEntity, bool>> ComposeFilter(Expression<Func<TEntity, bool>> predicate, TRequest request)
    {
        return predicate.Eq(x => x.Id, request.Id);
    }
}
