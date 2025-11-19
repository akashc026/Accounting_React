using ExcentOne.Persistence.Features;
using MediatR;

namespace ExcentOne.MediatR.EntityFrameworkCore;

public interface IDbOperation : IDataOperation, IBaseRequest
{
}

public interface IDbOperation<out TResponse> : IDbOperation, IRequest<TResponse>
{
}
