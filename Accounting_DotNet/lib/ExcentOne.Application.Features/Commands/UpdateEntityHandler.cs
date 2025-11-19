using ExcentOne.Linq.Extensions;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.MediatR.EntityFrameworkCore.Exceptions;
using ExcentOne.Persistence.Features.Models;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace ExcentOne.Application.Features.Commands;

public abstract class UpdateEntityHandler<TDbContext, TEntity, TKey, TRequest, TResponse> :
    DbCommandHandler<TDbContext, TEntity, TRequest, TResponse>
    where TDbContext : DbContext
    where TEntity : class, IEntity<TKey>
    where TKey : notnull, IEquatable<TKey>
    where TRequest : IUpdateEntity<TKey, TResponse>
{
    protected readonly IMapper Mapper;

    public UpdateEntityHandler(TDbContext dbContext, IMapper mapper) : base(dbContext)
    {
        ArgumentNullException.ThrowIfNull(mapper);
        Mapper = mapper;
    }

    protected virtual bool ThrowIfEntityNotFound => true;

    public override async Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken)
    {
        var entities = Entities.AsExpandable();
        var predicate = ComposeFilter(PredicateBuilder.New<TEntity>(), request);
        var entity = await entities.FirstOrDefaultAsync(predicate, cancellationToken);

        if (entity is null)
        {
            var exception = new EntityNotFoundException(typeof(TEntity), request.Id);
            if (ThrowIfEntityNotFound)
            {
                throw exception;
            }
            else
            {
                return await OnCommandFailedAsync(new(request, entity!, exception), cancellationToken);
            }
        }

        entity = await UpdateEntityAsync(request, entity, Mapper, cancellationToken);

        var entry = Entities.Update(entity);
        OnEntityTracked(request, entry);

        return await SaveChangesAsync(request, entity, cancellationToken);
    }

    protected override Expression<Func<TEntity, bool>> ComposeFilter(Expression<Func<TEntity, bool>> predicate, TRequest request)
    {
        return predicate.Eq(x => x.Id, request.Id);
    }

    protected virtual TEntity UpdateEntity(TRequest request, TEntity entity, IMapper mapper)
    {
        entity = mapper.Map(request, entity);
        return entity;
    }

    protected virtual Task<TEntity> UpdateEntityAsync(TRequest request, TEntity entity, IMapper mapper, CancellationToken cancellationToken)
    {
        var result = UpdateEntity(request, entity, mapper);
        return Task.FromResult(result);
    }
}