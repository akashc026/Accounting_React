using System.Linq;
using System.Linq.Expressions;

namespace ExcentOne.Application.Features.Queries;

internal static class SoftDeleteQueryHelper<TEntity>
    where TEntity : class
{
    private const string IsDeletedPropertyName = "IsDeleted";
    private static readonly Expression<Func<TEntity, bool>>? Predicate = BuildPredicate();

    internal static IQueryable<TEntity> Apply(IQueryable<TEntity> queryable)
    {
        return Predicate is null ? queryable : queryable.Where(Predicate);
    }

    private static Expression<Func<TEntity, bool>>? BuildPredicate()
    {
        var propertyInfo = typeof(TEntity).GetProperty(IsDeletedPropertyName);
        if (propertyInfo is null || propertyInfo.PropertyType != typeof(bool))
        {
            return null;
        }

        var parameter = Expression.Parameter(typeof(TEntity), "entity");
        var propertyAccess = Expression.Property(parameter, propertyInfo);
        var condition = Expression.Equal(propertyAccess, Expression.Constant(false));

        return Expression.Lambda<Func<TEntity, bool>>(condition, parameter);
    }
}
