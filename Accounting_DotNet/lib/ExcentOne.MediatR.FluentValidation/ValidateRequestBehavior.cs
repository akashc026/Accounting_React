using FluentValidation;
using MediatR.Pipeline;

namespace ExcentOne.MediatR.FluentValidation;

public class ValidateRequestBehavior<TRequest>(IEnumerable<IValidator<TRequest>> validators) : 
    IRequestPreProcessor<TRequest>
    where TRequest : notnull
{
    protected virtual bool CanValidate(TRequest request) => request is not null;

    public virtual async Task Process(TRequest request, CancellationToken cancellationToken)
    {
        if (!(validators.Any() && CanValidate(request)))
        {
            return;
        }

        ValidationContext<TRequest> validationContext = new (request);

        var failures = await Task
            .WhenAll(validators
            .Select(v => v
            .ValidateAsync(validationContext, cancellationToken)));

        var errors = failures
            .SelectMany(f => f.Errors)
            .Where(e => e != null)
            .ToList();

        if (errors.Count > 0)
        {
            throw new ValidationException($"Validation errors found for \"{request.GetType().Name}\" request.", errors);
        }
    }
}
