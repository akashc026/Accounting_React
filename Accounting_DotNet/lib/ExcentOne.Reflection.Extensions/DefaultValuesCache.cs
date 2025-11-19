using System.Collections.Concurrent;
using System.Linq.Expressions;

namespace ExcentOne.Reflection.Extensions;

public class DefaultValuesCache
{
    public static readonly ConcurrentDictionary<Type, Lazy<Func<object?>>> typeConstructorCache = new();

    public static object? NewOrDefault(Type type)
    {
        ArgumentNullException.ThrowIfNull(type);
        var constructor = typeConstructorCache
            .GetOrAdd(type, static t => new(() =>
            {
                var type = Nullable.GetUnderlyingType(t) ?? t;

                try
                {
                    if (type == typeof(object))
                    {
                        return () => null;
                    }

                    var newExpression = Expression.New(type);
                    var boxExpression = Expression.Convert(newExpression, typeof(object));
                    var lambdaExpression = Expression.Lambda<Func<object?>>(boxExpression);
                    return lambdaExpression.Compile();
                }
                catch (Exception)
                {
                    return () => type.IsPrimitive ? System.Activator.CreateInstance(t) : null;
                }
            }));

        return constructor.Value();
    }
}
