namespace ExcentOne.MediatR.EntityFrameworkCore.Query;

public sealed record DbQuerySuccessArgs<TRequest, TResult>(TRequest Request, TResult Result, long Count = 0);