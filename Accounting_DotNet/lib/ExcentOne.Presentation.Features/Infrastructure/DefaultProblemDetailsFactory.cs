using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace ExcentOne.Presentation.Features.Infrastructure;

public class DefaultProblemDetailsFactory : ProblemDetailsFactory
{
    public override ProblemDetails CreateProblemDetails(
        HttpContext httpContext, 
        int? statusCode = null, 
        string? title = null, 
        string? type = null, 
        string? detail = null, 
        string? instance = null)
    {
        return new ()
        {
            Type = type,
            Title = title ?? "Internal Server Error",
            Status = statusCode ?? StatusCodes.Status500InternalServerError,
            Detail = detail ?? "An internal server error has occurred.",
            Instance = instance ?? httpContext.Request.Path,
        };
    }

    public override ValidationProblemDetails CreateValidationProblemDetails(
        HttpContext httpContext, 
        ModelStateDictionary modelStateDictionary, 
        int? statusCode = null, 
        string? title = null,
        string? type = null, 
        string? detail = null, 
        string? instance = null)
    {
        return new(modelStateDictionary)
        {
            Type = type,
            Title = title ?? "Bad Request",
            Status = statusCode ?? StatusCodes.Status400BadRequest,
            Detail = detail ?? "One or more validation errors occurred.",
            Instance = instance ?? httpContext.Request.Path,
        };
    }
}
