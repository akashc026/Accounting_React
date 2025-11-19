using Microsoft.Extensions.DependencyInjection;

namespace ExcentOne.Application.Features;

public interface IApplicationFeature
{
    public IServiceCollection Service { get; }
}
