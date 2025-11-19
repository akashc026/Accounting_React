using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Reflection;

namespace ExcentOne.Reflection.Extensions.Activator;

public static class ObjectFactory
{
    public static object Create(Type typeToCreate, params object[] args)
    {
        var activator = ActivatorCache.GetOrCreate(typeToCreate, args);
        return activator(args);
    }

    public static T Create<T>(params object[] args)
    {
        return (T)Create(typeof(T), args);
    }

    public static T Create<T>(Type typeToCreate, params object[] args)
    {
        var returnType = typeof(T);
        if (!typeToCreate.IsAssignableTo(returnType))
        {
            throw new InvalidCastException($"{typeToCreate.FullName} is not assignable to the generic type {returnType.FullName}.");
        }

        var activator = ActivatorCache.GetOrCreate(typeToCreate, args);
        return (T)activator(args);
    }

    class ActivatorCache
    {
        private static readonly ConcurrentDictionary<Type, ObjectActivator> typeActivators = new();

        public static ObjectActivator GetOrCreate(Type type, params object[] args)
        {
            return typeActivators.GetOrAdd(type, (t) =>
            {
                var argTypes = args.Select(t => t.GetType()).ToArray();
                var ctor = t.GetConstructor(argTypes);
                var ctorParams = ctor!.GetParameters();
                var paramsExpr = Expression.Parameter(typeof(object[]), "args");
                var exprList = new Expression[args.Length];

                for (int i = 0; i < args.Length; i++)
                {
                    var index = Expression.Constant(i);
                    var paramType = ctorParams[i].ParameterType;

                    var paramAccessorExp = Expression.ArrayIndex(paramsExpr, index);
                    var paramCastExp = Expression.Convert(paramAccessorExp, paramType);

                    exprList[i] = paramCastExp;
                }

                var newExpr = Expression.New(ctor, exprList);
                var lambda = Expression.Lambda(typeof(ObjectActivator), newExpr, paramsExpr);
                return (ObjectActivator)lambda.Compile();
            });
        }
    }
}
