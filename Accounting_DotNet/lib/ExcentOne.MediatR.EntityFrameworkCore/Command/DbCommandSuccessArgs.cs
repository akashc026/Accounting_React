namespace ExcentOne.MediatR.EntityFrameworkCore.Command;

public sealed record DbCommandSuccessArgs<TRequest, TEntity>(TRequest Request, TEntity Entity);
