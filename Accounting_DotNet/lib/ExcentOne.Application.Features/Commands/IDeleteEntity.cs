using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.Persistence.Features.Commands;
using MediatR;

namespace ExcentOne.Application.Features.Commands;

public interface IDeleteEntity<TKey> : IDbCommand<Unit>, IDeleteCommand, IGetById<TKey>
    where TKey : notnull, IEquatable<TKey>
{
}
