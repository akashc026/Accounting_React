using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.Persistence.Features.Models;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace ExcentOne.Application.Features.Commands;

public abstract class UpsertEntityHandler<TDbContext, TEntity, TKey, TRequest, TResponse> :
    DbCommandHandler<TDbContext, TEntity, TRequest, TResponse>
    where TDbContext : DbContext
    where TEntity : class, IEntity<TKey>
    where TKey : notnull, IEquatable<TKey>
    where TRequest : IUpsertEntity<TKey, TResponse>
{
    protected readonly IMapper Mapper;

    protected UpsertEntityHandler(TDbContext dbContext, IMapper mapper) : base(dbContext)
    {
        ArgumentNullException.ThrowIfNull(mapper);
        Mapper = mapper;
    }

    public override async Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken)
    {
        var entities = Entities.AsExpandable();
        var predicate = ComposeFilter(PredicateBuilder.New<TEntity>(), request);
        var entity = await entities.FirstOrDefaultAsync(predicate, cancellationToken);
        var exists = entity is not null;

        entity = exists switch
        {
            true => await UpdateEntityAsync(request, entity!, Mapper, cancellationToken),
            false => await CreateEntityAsync(request, Mapper, cancellationToken)
        };

        var entry = exists switch
        {
            true => Entities.Update(entity),
            false => await Entities.AddAsync(entity, cancellationToken)
        };

        OnEntityTracked(request, entry);

        return await SaveChangesAsync(request, entity, cancellationToken);
    }

    protected virtual TEntity CreatEntity(TRequest request, IMapper mapper)
    {
        var entity = mapper.Map<TEntity>(request);
        return entity;
    }

    protected virtual Task<TEntity> CreateEntityAsync(TRequest request, IMapper mapper, CancellationToken cancellationToken)
    {
        var entity = CreatEntity(request, mapper);
        return Task.FromResult(entity);
    }

    protected virtual TEntity UpdateEntity(TRequest request, TEntity entity, IMapper mapper)
    {
        entity = mapper.Map(request, entity);
        return entity;
    }

    protected virtual Task<TEntity> UpdateEntityAsync(TRequest request, TEntity entity, IMapper mapper, CancellationToken cancellationToken)
    {
        entity = UpdateEntity(request, entity, mapper);
        return Task.FromResult(entity);
    }


    protected virtual void OnEntityCreated(TEntity entity, TRequest request)
    {

    }

    protected virtual void OnEntityUpdated(TEntity entity, TRequest request)
    {

    }
}