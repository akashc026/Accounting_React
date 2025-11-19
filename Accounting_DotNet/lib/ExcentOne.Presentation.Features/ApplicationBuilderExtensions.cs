using ExcentOne.Presentation.Features.Exceptions;
using Microsoft.AspNetCore.Builder;

namespace ExcentOne.Presentation.Features;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseExceptionHandlers(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}
