using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.Extensions.DependencyInjection;

namespace ExcentOne.Presentation.Features.Routing;

public static class MvcRoutingOptionsExtensions
{
    public static MvcOptions SlugifyUrlTokens(this MvcOptions options)
    {
        SlugifyParameterTransformer transformer = new ();
        RouteTokenTransformerConvention convention = new (transformer);
        options.Conventions.Add(convention);
        return options;
    }
}
