namespace ExcentOne.MediatR.EntityFrameworkCore.Query;

public sealed record DbQueryFailedArgs<TRequest>(TRequest Request, Exception Exception);
