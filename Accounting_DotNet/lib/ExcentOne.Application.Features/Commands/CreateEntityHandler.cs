using ExcentOne.Linq.Extensions;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.MediatR.EntityFrameworkCore.Exceptions;
using ExcentOne.Persistence.Features.Models;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace ExcentOne.Application.Features.Commands;

public abstract class CreateEntityHandler<TDbContext, TEntity, TKey, TRequest, TResponse> :
    DbCommandHandler<TDbContext, TEntity, TRequest, TResponse>
    where TDbContext : DbContext
    where TEntity : class, IEntity<TKey>
    where TKey : notnull, IEquatable<TKey>
    where TRequest : ICreateEntity<TKey, TResponse>
{
    protected readonly IMapper Mapper;

    protected CreateEntityHandler(TDbContext dbContext, IMapper mapper) : base(dbContext)
    {
        ArgumentNullException.ThrowIfNull(mapper);
        Mapper = mapper;
    }

    public virtual bool ThrowIfEntityExists => true;

    public override async Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken)
    {
        var entities = Entities.AsExpandable();
        var predicate = ComposeFilter(PredicateBuilder.New<TEntity>(), request);

        var entity = await entities.FirstOrDefaultAsync(predicate, cancellationToken);

        if (entity is not null)
        {
            var exception = new EntityExistsException(entity);

            if (ThrowIfEntityExists)
            {
                throw exception;
            }
            else
            {
                return await OnCommandFailedAsync(new(request, entity, exception), cancellationToken);
            }
        }

        entity = await CreateEntityAsync(request, Mapper, cancellationToken);
        OnEntityCreated(request, entity);

        var entry = await Entities.AddAsync(entity, cancellationToken);
        OnEntityTracked(request, entry);

        return await SaveChangesAsync(request, entity, cancellationToken);
    }

    protected override Expression<Func<TEntity, bool>> ComposeFilter(Expression<Func<TEntity, bool>> predicate, TRequest request)
    {
        return predicate.Eq(e => e.Id, request.Id);
    }

    protected virtual TEntity CreateEntity(TRequest request, IMapper mapper)
    {
        var entity = mapper.Map<TEntity>(request);
        return entity;
    }

    protected virtual Task<TEntity> CreateEntityAsync(TRequest request, IMapper mapper, CancellationToken cancellationToken)
    {
        var entity = CreateEntity(request, mapper);
        return Task.FromResult(entity);
    }

    protected virtual void OnEntityCreated(TRequest request, TEntity entity)
    {

    }
}