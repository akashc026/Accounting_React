using ExcentOne.Persistence.Features.Commands;
using MediatR;

namespace ExcentOne.MediatR.EntityFrameworkCore.Command;

public interface IDbCommand : IDataCommand, IBaseRequest
{
}

public interface IDbCommand<out TResponse> : IDbCommand, IDbOperation<TResponse>
{
}
