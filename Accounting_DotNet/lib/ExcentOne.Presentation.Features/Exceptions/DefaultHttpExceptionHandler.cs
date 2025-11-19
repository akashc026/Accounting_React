using ExcentOne.Application.Features.Exceptions;
using ExcentOne.Presentation.Features.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Net.Mime;

namespace ExcentOne.Presentation.Features.Exceptions;

public class DefaultHttpExceptionHandler(
    IHttpContextAccessor contextAccessor, 
    DefaultProblemDetailsFactory problemDetailsFactory,
    ILogger<DefaultHttpExceptionHandler> logger) :
    IDefaultExceptionHandler
{
    public bool IsHandled { get; private set; }

    public Type ExceptionType { get; private set; } = typeof(Exception);

    private HttpContext Context => contextAccessor.HttpContext!;

    public async ValueTask<bool> HandleAsync(Exception ex, CancellationToken cancellationToken = default)
    {
        ExceptionType = ex.GetType();

        logger.LogError(ex, "An unhandled {exception} was thrown by the application.", ExceptionType.FullName);

        var details = problemDetailsFactory
            .CreateProblemDetails(
                httpContext: Context,
                detail: ex.ToString(),
                instance: Context.Request.Path
            );
        Context.Response.ContentType = MediaTypeNames.Application.ProblemJson;
        Context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await Context.Response.WriteAsJsonAsync(details, cancellationToken: cancellationToken);

        return IsHandled = true;
    }
}
