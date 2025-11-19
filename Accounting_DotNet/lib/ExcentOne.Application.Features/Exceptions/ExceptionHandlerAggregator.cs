
namespace ExcentOne.Application.Features.Exceptions;

public class ExceptionHandlerAggregator(IEnumerable<IExceptionHandler> handlers, IDefaultExceptionHandler defaultHandler) : IExceptionHandlerAggregator
{
    private bool isHandled = false;
    private Type exceptionType = typeof(Exception);

    public IEnumerable<IExceptionHandler> Handlers => [..handlers, defaultHandler];
    public bool IsHandled => isHandled;
    public Type ExceptionType => exceptionType;

    public bool Handle(Exception ex)
    {
        isHandled = Handlers.OrderBy(h => h.Order).Aggregate(IsHandled, (handled, handler) =>
        {
            handled = handled || handler.Handle(ex);
            if (handled && exceptionType is null)
            {
                exceptionType = handler.ExceptionType;
            }
            return handled;
        });

        return isHandled;
    }

    public async ValueTask<bool> HandleAsync(Exception ex, CancellationToken cancellationToken = default)
    {
        isHandled = await Handlers
            .OrderBy(h => h.Order)
            .Aggregate(Task.FromResult(isHandled), async (task, handler) =>
            {
                var handled = await task || await handler.HandleAsync(ex, cancellationToken);
                if (handled)
                {
                    exceptionType = handler.ExceptionType;
                }
                return handled;
            });

        return isHandled;
    }
}
