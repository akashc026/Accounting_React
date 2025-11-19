using ExcentOne.Persistence.Features.Queries;
using MediatR;

namespace ExcentOne.MediatR.EntityFrameworkCore.Query;

public interface IDbQuery : IDataQuery, IBaseRequest
{
}

public interface IDbQuery<out TResponse> : IDbQuery, IDbOperation<TResponse>
{
}
