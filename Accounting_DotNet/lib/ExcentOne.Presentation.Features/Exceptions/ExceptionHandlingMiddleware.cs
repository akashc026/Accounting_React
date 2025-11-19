using ExcentOne.Application.Features.Exceptions;
using Microsoft.AspNetCore.Http;

namespace ExcentOne.Presentation.Features.Exceptions;

public class ExceptionHandlingMiddleware(IExceptionHandlerAggregator handlers) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
		try
		{
			await next(context);
		}
		catch (Exception ex)
		{
			await handlers.HandleAsync(ex);
        }
    }
}
