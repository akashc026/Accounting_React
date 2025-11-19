using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.Persistence.Features.Commands;

namespace ExcentOne.Application.Features.Commands;

public interface ICreateEntity<TKey, TResponse> : IDbCommand<TResponse>, ICreateCommand, IGetById<TKey>
    where TKey : notnull, IEquatable<TKey>
{
}

