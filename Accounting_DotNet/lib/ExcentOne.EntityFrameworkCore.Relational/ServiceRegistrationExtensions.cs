using ExcentOne.EntityFrameworkCore.Relational.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ExcentOne.EntityFrameworkCore.Relational;

public static class ServiceRegistrationExtensions
{
    [Obsolete("This is considered a leaky abstraction and will not be maintained anymore. Use ExcentOne.MediatR.EntityFrameworkCore BeginDbTransaction behaviour instead.")]
    public static IServiceCollection AddDbTransaction(this IServiceCollection services, Action<DbTransactionHttpRequestOptions>? configureAction = null)
    {
        services
            .AddTransient<BeginDbTransactionMiddleware>()
            .AddOptions<DbTransactionHttpRequestOptions>()
                .Configure<IConfiguration>((opt, cfg) => cfg.Bind(opt))
                .PostConfigure(opt => configureAction?.Invoke(opt));
            
        return services;
    }

    [Obsolete("This is considered a leaky abstraction and will not be maintained anymore. Use ExcentOne.MediatR.EntityFrameworkCore BeginDbTransaction behaviour instead.")]
    public static IApplicationBuilder UseDbTransaction(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<BeginDbTransactionMiddleware>();
    }
}
