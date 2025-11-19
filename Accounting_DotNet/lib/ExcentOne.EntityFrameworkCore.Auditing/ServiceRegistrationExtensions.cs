using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ExcentOne.EntityFrameworkCore.Auditing;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddEntityAuditingServices<TProvider>(this IServiceCollection services)
        where TProvider : class, IDbEntityAuditDetailsProvider
    {
        services.TryAddScoped<IDbEntityAuditDetailsProvider, TProvider>();
        services.TryAddScoped<PopulateAuditFieldsInterceptor>();

        return services;
    }

    public static DbContextOptionsBuilder AddAuditingInterceptor(this DbContextOptionsBuilder builder, IServiceProvider provider)
    {
        var interceptor = provider.GetRequiredService<PopulateAuditFieldsInterceptor>();
        builder.AddInterceptors(interceptor);
        return builder;
    }
}
