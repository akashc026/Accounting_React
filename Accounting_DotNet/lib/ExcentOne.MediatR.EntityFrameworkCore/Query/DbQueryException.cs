namespace ExcentOne.MediatR.EntityFrameworkCore.Query;

public class DbQueryException(IDbQuery query, Exception? inner) : Exception($"An exception has occurred while performing {query.GetType().Name} query. See inner exception for details.", inner)
{
    public IDbQuery Query { get; } = query;
}
