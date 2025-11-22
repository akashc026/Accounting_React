using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Linq.Extensions;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Linq.Expressions;

namespace ExcentOne.Application.Features.Queries;

public abstract class GetEntitiesHandler<TDbContext, TEntity, TRequest, TResponse>(TDbContext dbContext, IMapper mapper) :
    DbQueryHandler<TDbContext, TEntity, TRequest, IEnumerable<TEntity>, TResponse>(dbContext: dbContext)
    where TDbContext : DbContext
    where TEntity : class, IEntity
    where TRequest : IGetEntities<TResponse>
{
    protected readonly IMapper Mapper = mapper;

    public override async Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken)
        => await ExecuteQueryAsync(async (req, toek) =>
        {
            var entities = Entities.AsExpandable();
            var builder = PredicateBuilder.New<TEntity>(false);
            var predicate = ComposeFilter(builder, request);
            if (predicate == builder.DefaultExpression)
            {
                predicate = PredicateBuilder.New<TEntity>(true);
            }

            var defaultSorted = ApplyDefaultSorting(entities, request);
            var filtered = ApplyFiltering(defaultSorted, predicate, request);
            var sorted = ApplySorting(filtered, request);
            var paginated = ApplyPagination(sorted, request);

            var result = await paginated.ToListAsync(cancellationToken);
            var count = await filtered.LongCountAsync(cancellationToken);

            return new(request, result, count);
        }, request, cancellationToken);

    protected virtual IQueryable<TEntity> ApplySorting(IQueryable<TEntity> queryable, TRequest request)
    {
        if (request is ISortCollection sortable)
        {
            var sorting = sortable.Sorting
                .Select((s, i) =>
                {
                    s.Order ??= i;
                    return s;
                })
                .OrderBy(s => s.Order);

            return sorting.Aggregate(queryable, (qry, sort) =>
                qry.OrderBy(sort.Field, sort.IsDescending));
        }

        return queryable;
    }

    protected virtual IQueryable<TEntity> ApplyFiltering(IQueryable<TEntity> queryable, Expression<Func<TEntity, bool>> predicate, TRequest request)
    {
        return queryable.Where(predicate);
    }

    protected virtual IQueryable<TEntity> ApplyDefaultSorting(IQueryable<TEntity> queryable, TRequest request)
    {
        if (!typeof(ICreateAudit).IsAssignableFrom(typeof(TEntity)))
        {
            return queryable;
        }

        return queryable.OrderByDescending(entity =>
            EF.Property<DateTime>(entity, nameof(ICreateAudit.CreatedDate)));
    }

    protected virtual IQueryable<TEntity> ApplyPagination(IQueryable<TEntity> queryable, TRequest request)
    {
        if (request is IPageCollection page)
        {
            var index = Math.Max(page.PageNumber - 1, 0);
            var size = Math.Max(page.PageSize, IPageCollection.DefaultPageSize);

            queryable = queryable
                .Skip(index * size)
                .Take(size);
        }

        return queryable;
    }
}
