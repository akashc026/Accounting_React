using System.Threading;

namespace ExcentOne.Application.Features.Exceptions;

public interface IExceptionHandler<in TException> : IExceptionHandler where TException : Exception
{
    bool Handle(TException ex) => IsHandled;
    ValueTask<bool> HandleAsync(TException ex, CancellationToken cancellationToken = default)
    {
        var handled = Handle(ex);
        return ValueTask.FromResult(handled);
    }

    Type IExceptionHandler.ExceptionType => typeof(TException);
    bool IExceptionHandler.Handle(Exception ex)
    {
        if (ex is not TException exception)
        {
            return false;
        }

        return this.Handle(exception);
    }
    async ValueTask<bool> IExceptionHandler.HandleAsync(Exception ex, CancellationToken cancellationToken)
    {
        if (ex is not TException exception)
        {
            return false;
        }

        return await this.HandleAsync(exception, cancellationToken);
    }
}

public interface IExceptionHandler
{
    int Order => default;
    bool IsHandled { get; }
    Type ExceptionType { get; }
    bool Handle(Exception ex) => IsHandled;
    ValueTask<bool> HandleAsync(Exception ex, CancellationToken cancellationToken = default)
    {
        var handled = Handle(ex);
        return ValueTask.FromResult(handled);
    }
}
