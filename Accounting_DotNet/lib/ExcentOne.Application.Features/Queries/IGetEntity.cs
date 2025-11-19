using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.MediatR.EntityFrameworkCore.Query;

namespace ExcentOne.Application.Features.Queries;

public interface IGetEntity<TKey, out TResponse> : IDbQuery<TResponse>, IGetById<TKey>
    where TKey : notnull, IEquatable<TKey>
{
}
