using ExcentOne.EntityFrameworkCore.Relational;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ExcentOne.MediatR.EntityFrameworkCore.Query;

public class OptimizeQueryingBehavior<TRequest, TResponse>(IDbContextProvider provider) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IDbQuery<TResponse>
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        TResponse response;

		try
		{
            var changeTracker = provider.DbContext.ChangeTracker;
            var previousQueryTrackingBehavior = changeTracker.QueryTrackingBehavior;

            changeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTrackingWithIdentityResolution;
            response = await next();
            changeTracker.QueryTrackingBehavior = previousQueryTrackingBehavior;
        }
		catch (Exception ex)
		{
			throw new DbQueryException(request, ex);
		}

        return response;
    }
}
