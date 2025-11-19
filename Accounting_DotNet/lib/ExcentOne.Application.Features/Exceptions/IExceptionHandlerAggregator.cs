
namespace ExcentOne.Application.Features.Exceptions;

public interface IExceptionHandlerAggregator : IExceptionHandler
{
    IEnumerable<IExceptionHandler> Handlers { get; }
    //new bool Handle(Exception ex) => IsHandled;
    //new ValueTask<bool> HandleAsync(Exception ex, CancellationToken cancellationToken = default);
    //bool IExceptionHandler.Handle(Exception ex) => this.Handle(ex);
    //ValueTask<bool> IExceptionHandler.HandleAsync(Exception ex, CancellationToken cancellationToken) => this.HandleAsync(ex, cancellationToken);
}
