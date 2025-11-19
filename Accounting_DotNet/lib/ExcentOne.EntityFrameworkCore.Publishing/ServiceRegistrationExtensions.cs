using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ExcentOne.EntityFrameworkCore.Publishing;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddEntityPublishingServices(this IServiceCollection services)
    {
        services.TryAddScoped<EntityChangesNotificationPublisherInterceptor>();
        return services;
    }

    public static DbContextOptionsBuilder AddPublishingInterceptor(this DbContextOptionsBuilder builder, IServiceProvider provider)
    {
        var interceptor = provider.GetRequiredService<EntityChangesNotificationPublisherInterceptor>();
        builder.AddInterceptors(interceptor);
        return builder;
    }
}
