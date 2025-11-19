using ExcentOne.Application.Features.Exceptions;
using ExcentOne.Presentation.Features.Infrastructure;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Net.Mime;

namespace ExcentOne.Presentation.Features.Exceptions;

public class ValidationExceptionHandler(IHttpContextAccessor accessor, DefaultProblemDetailsFactory problemDetailsFactory) : IExceptionHandler<ValidationException>
{
    public bool IsHandled { get; private set; }

    public async ValueTask<bool> HandleAsync(ValidationException ex, CancellationToken cancellationToken)
    {
        if (accessor.HttpContext is { } context)
        {
            var modelState = ToModelState(ex, new());
            var problemDetails = problemDetailsFactory
                .CreateValidationProblemDetails(
                    httpContext: context,
                    modelStateDictionary: modelState,
                    title: "Validation Error",
                    detail: ex.Message,
                    instance: context.Request.Path
                );

            context.Response.ContentType = MediaTypeNames.Application.ProblemJson;
            context.Response.StatusCode = StatusCodes.Status400BadRequest;

            await context.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
            IsHandled = true;
        }

        return IsHandled;
    }

    private static ModelStateDictionary ToModelState(ValidationException exception, ModelStateDictionary? modelState = null)
    {
        modelState ??= new();
        foreach (var failure in exception.Errors)
        {
            modelState.AddModelError(failure.PropertyName, failure.ErrorMessage);
        }
        return modelState;
    }
}
