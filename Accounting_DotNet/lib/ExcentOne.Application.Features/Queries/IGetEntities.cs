using ExcentOne.MediatR.EntityFrameworkCore.Query;

namespace ExcentOne.Application.Features.Queries;

public interface IGetEntities<TResponse> : IDbQuery<TResponse>
{
}
