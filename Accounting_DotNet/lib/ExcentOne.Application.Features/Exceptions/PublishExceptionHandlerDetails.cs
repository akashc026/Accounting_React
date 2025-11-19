using MediatR;
using MediatR.Pipeline;

namespace ExcentOne.Application.Features.Exceptions;

public class PublishExceptionHandlerDetails<TRequest, TResponse, TException>(IMediator mediator) : IRequestExceptionHandler<TRequest, TResponse, TException>
    where TRequest : notnull
    where TException : Exception
{
    public async Task Handle(TRequest request, TException exception, RequestExceptionHandlerState<TResponse> state, CancellationToken cancellationToken)
    {
        RequestExceptionEventArgs<TRequest, TException> notification = new()
        {
            Request = request,
            Exception = exception
        };
        await mediator.Publish(notification, cancellationToken);
    }
}
