using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.MediatR.FluentValidation;
using FluentValidation;

namespace ExcentOne.Application.Features.Validation;

public class ValidateDbCommandBehavior<TRequest>(IEnumerable<IValidator<TRequest>> validators) : 
    ValidateRequestBehavior<TRequest>(validators)
    where TRequest : notnull, IDbCommand
{
    protected override bool CanValidate(TRequest request) => request is IDbCommand;
}
