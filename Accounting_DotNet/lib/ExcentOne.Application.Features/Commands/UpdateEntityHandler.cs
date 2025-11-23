using System;
using System.Linq.Expressions;
using System.Reflection;
using ExcentOne.Linq.Extensions;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.MediatR.EntityFrameworkCore.Exceptions;
using ExcentOne.Persistence.Features.Models;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

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
        var entities = Entities
            .IgnoreQueryFilters()
            .AsExpandable();
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
        if (SoftDeleteUpdateHelper.TryApply(request, entity))
        {
            return entity;
        }

        entity = mapper.Map(request, entity);
        return entity;
    }

    protected virtual Task<TEntity> UpdateEntityAsync(TRequest request, TEntity entity, IMapper mapper, CancellationToken cancellationToken)
    {
        var result = UpdateEntity(request, entity, mapper);
        return Task.FromResult(result);
    }

    private static class SoftDeleteUpdateHelper
    {
        private const string IsDeletedPropertyName = "IsDeleted";
        private static readonly PropertyInfo[] RequestProperties = typeof(TRequest)
            .GetProperties(BindingFlags.Public | BindingFlags.Instance);

        private static readonly PropertyInfo? RequestIsDeletedProperty = typeof(TRequest)
            .GetProperty(IsDeletedPropertyName, BindingFlags.Public | BindingFlags.Instance);

        private static readonly PropertyInfo? EntityIsDeletedProperty = typeof(TEntity)
            .GetProperty(IsDeletedPropertyName, BindingFlags.Public | BindingFlags.Instance);

        internal static bool TryApply(TRequest request, TEntity entity)
        {
            if (RequestIsDeletedProperty is null || EntityIsDeletedProperty is null)
            {
                return false;
            }

            if (!TryGetIsDeletedValue(request, out var isDeleted))
            {
                return false;
            }

            if (HasAdditionalUpdates(request))
            {
                return false;
            }

            EntityIsDeletedProperty.SetValue(entity, isDeleted);
            return true;
        }

        private static bool TryGetIsDeletedValue(TRequest request, out bool value)
        {
            value = default;
            if (RequestIsDeletedProperty is null)
            {
                return false;
            }

            var rawValue = RequestIsDeletedProperty.GetValue(request);
            if (rawValue is null)
            {
                return false;
            }

            if (rawValue is bool boolean)
            {
                value = boolean;
                return true;
            }

            try
            {
                value = (bool)Convert.ChangeType(rawValue, typeof(bool));
                return true;
            }
            catch
            {
                return false;
            }
        }

        private static bool HasAdditionalUpdates(TRequest request)
        {
            foreach (var property in RequestProperties)
            {
                if (property == RequestIsDeletedProperty)
                {
                    continue;
                }

                if (string.Equals(property.Name, nameof(IUpdateEntity<TKey, TResponse>.Id), StringComparison.Ordinal))
                {
                    continue;
                }

                var value = property.GetValue(request);
                if (value is null)
                {
                    continue;
                }

                var propertyType = property.PropertyType;
                if (propertyType.IsValueType && Nullable.GetUnderlyingType(propertyType) is null)
                {
                    var defaultValue = Activator.CreateInstance(propertyType);
                    if (Equals(value, defaultValue))
                    {
                        continue;
                    }
                }

                return true;
            }

            return false;
        }
    }
}
