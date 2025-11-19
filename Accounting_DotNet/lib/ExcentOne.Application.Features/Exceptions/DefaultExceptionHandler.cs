using Microsoft.Extensions.Logging;

namespace ExcentOne.Application.Features.Exceptions;

public interface IDefaultExceptionHandler : IExceptionHandler
{
    bool IExceptionHandler.IsHandled => true;
    Type IExceptionHandler.ExceptionType => typeof(Exception);
}

public class DefaultExceptionHandler(ILogger<DefaultExceptionHandler> logger) : IDefaultExceptionHandler
{
    public int Order => int.MaxValue;
    public Type ExceptionType { get; private set; } = typeof(Exception);
    public bool Handle(Exception ex)
    {
        ExceptionType = ex.GetType();
        logger.LogError(ex, "An unhandled {exception} was thrown by the application.", ExceptionType.FullName);
        return true;
    }
}
