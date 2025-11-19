using MediatR;

namespace ExcentOne.Application.Features.Exceptions;

public class RequestExceptionEventArgs<TRequest, TException> : EventArgs, INotification
{
    public TRequest Request { get; init; } = default!;
    public TException Exception { get; init; } = default!;
}
