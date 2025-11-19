using System.Linq.Expressions;

namespace ExcentOne.Linq.Extensions;

public static class QueryableExpressionExtensions
{
    private class RebindParameterVisitor(ParameterExpression oldParameter, ParameterExpression newParameter) : ExpressionVisitor
    {
        protected override Expression VisitParameter(ParameterExpression node)
        {
            if (node == oldParameter)
            {
                return newParameter;
            }

            return base.VisitParameter(node);
        }
    }

    public static Expression<Func<TEntity, bool>> Eq<TEntity, TKey>(this Expression<Func<TEntity, bool>> startingExpr, Expression<Func<TEntity, TKey>> keySelector, TKey key)
    {
        var startingExprParam = startingExpr.Parameters[0];
        var keySelectorExprParam = keySelector.Parameters[0];
        var rebindKey = new RebindParameterVisitor(keySelectorExprParam, startingExprParam).Visit(keySelector.Body);
        ConstantExpression constant = Expression.Constant(key, typeof(TKey));
        BinaryExpression binary = Expression.Equal(rebindKey, constant);
        if (startingExpr.Body is ConstantExpression constantExpr && constantExpr.Value is bool prevValue)
        {
            binary = prevValue
                ? Expression.AndAlso(constantExpr, binary)
                : Expression.OrElse(constantExpr, binary);
        }
        var lambda = Expression.Lambda<Func<TEntity, bool>>(binary, startingExprParam);
        return lambda;
    }
}
