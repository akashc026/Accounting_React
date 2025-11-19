namespace ExcentOne.MediatR.EntityFrameworkCore.Command;

public sealed record DbCommandFailedArgs<TRequest, TEntity>(TRequest Request, TEntity Entity, Exception? Exception = null)
{
    public bool IsExceptionHandled { get; set; }
}
