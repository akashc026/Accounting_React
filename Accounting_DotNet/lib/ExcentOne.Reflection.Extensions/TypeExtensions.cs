using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace ExcentOne.Reflection.Extensions;

public static class TypeExtensions
{
    public static T ConstructAs<T>(this Type t, params object?[] parameters)
    {
        if (typeof(T) != t)
        {
            throw new InvalidCastException();
        }

        var @paramTypes = parameters.Select(p => p.GetType()).ToArray();
        var constructor = t.GetConstructor(@paramTypes);

        if (constructor is null)
        {
            return default!
        }

        var @paramExpressions = @paramTypes
            .Select((p, i) => Expression.Parameter(p, $"p{0}"));


        var @new = Expression.New(constructor, @paramExpressions);
        var lambda = Expression.Lambda<Func<T>>(@new, @paramExpressions);

        var instance = lambda.Compile(parameters);

    }
}
