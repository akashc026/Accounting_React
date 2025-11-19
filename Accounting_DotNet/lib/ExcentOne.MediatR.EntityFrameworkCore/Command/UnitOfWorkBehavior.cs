using ExcentOne.Persistence.Features;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ExcentOne.MediatR.EntityFrameworkCore.Command;

public class UnitOfWorkBehavior<TRequest, TResponse>(IUnitOfWork unitOfWork) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IDbCommand
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        TResponse response;

        await unitOfWork.BeginAsync(cancellationToken);

		try
		{
            response = await next();
            await unitOfWork.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
		{
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
		}
        catch (Exception ex)
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw new DbCommmandException(request, ex);
        }

        return response;
    }
}
