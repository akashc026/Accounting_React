using Microsoft.AspNetCore.Routing;
using System.Text.RegularExpressions;

namespace ExcentOne.Presentation.Features.Routing;

partial class SlugifyParameterTransformer : IOutboundParameterTransformer
{
    public string? TransformOutbound(object? value)
    {
        if (value is null || value.ToString() is not string param)
        {
            return null;
        }

        return Slugify().Replace(param, "$1-$2").ToLower();
    }

    [GeneratedRegex("([a-z])([A-Z])")]
    private static partial Regex Slugify();
}
