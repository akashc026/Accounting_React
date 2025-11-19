using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.Persistence.Features.Commands;

namespace ExcentOne.Application.Features.Commands;

public interface IUpdateEntity<TKey, TResponse> : IDbCommand<TResponse>, IUpdateCommand, IGetById<TKey>
    where TKey : notnull, IEquatable<TKey>
{
}

