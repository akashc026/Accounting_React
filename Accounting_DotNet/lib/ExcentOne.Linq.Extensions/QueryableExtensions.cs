using System.Linq.Expressions;

namespace ExcentOne.Linq.Extensions;

public static class QueryableExtensions
{
    public static IQueryable<T> OrderBy<T>(this IQueryable<T> source, string orderByProperty, bool desc)
    {
        var type = typeof(T);
        var property = type.GetProperty(orderByProperty);
        if (property is null)
        {
            return source;
        }

        var ordered = source as IOrderedQueryable<T>;
        var command = ordered is not null ? "ThenBy" : "OrderBy";
        command = desc ? $"{command}Descending" : command;

        var parameter = Expression.Parameter(type, "p");
        var propertyAccess = Expression.MakeMemberAccess(parameter, property);
        var orderByExpression = Expression.Lambda(propertyAccess, parameter);
        var resultExpression = Expression.Call(typeof(Queryable), command, [type, property.PropertyType], source.Expression, Expression.Quote(orderByExpression));
        return source.Provider.CreateQuery<T>(resultExpression);
    }
}
