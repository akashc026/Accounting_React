using ExcentOne.Application.Features.Auditing;
using ExcentOne.Application.Features.Exceptions;
using ExcentOne.Application.Features.Security;
using ExcentOne.Presentation.Features.Exceptions;
using ExcentOne.Presentation.Features.Security;
using ExcentOne.EntityFrameworkCore.Auditing;
using ExcentOne.EntityFrameworkCore.Publishing;
using ExcentOne.EntityFrameworkCore.SqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using ExcentOne.Presentation.Features.Infrastructure;
using ExcentOne.EntityFrameworkCore.Relational;
using ExcentOne.Application.Features.Validation;
using MediatR;
using MediatR.Pipeline;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using System.Net.NetworkInformation;

namespace ExcentOne.Presentation.Features;

public class SqlServerDbContextRegistrationOptions
{
    public int MaxPoolSize { get; set; } = 1024;
    public bool UseEntityChangesAuditing { get; set; } = true;
    public bool UseEntityChangesPublishing { get; set; } = true;
    public bool UseMediatRPipelineBehaviors { get; set; } = true;
    public bool UseValidateDbCommandsForDbWrites { get; set; } = true;
    public bool UseDbTransactionForDbWrites { get; set; } = true;
    public bool UseDisableChangeTrackingForDbReads { get; set; } = true;
    public Action<SqlServerDatabaseOptions>? ConfigureDbConnection { get; set; }
    public Action<DbEntityAuditDetailsProviderOptions>? ConfigureAuditing { get; set; }
}

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddExceptionHandlersFromAssemblyOf<T>(this IServiceCollection services)
        => services.AddExceptionHandlers(typeof(T).Assembly);

    public static IServiceCollection AddExceptionHandlers(this IServiceCollection services, Assembly assembly, params Assembly[] additionalAssemblies)
    {
        services.TryAddScoped<ExceptionHandlingMiddleware>();
        services.TryAddScoped<DefaultProblemDetailsFactory>();
        services.TryAddScoped<IExceptionHandlerAggregator, ExceptionHandlerAggregator>();
        services.TryAddScoped<IDefaultExceptionHandler, DefaultHttpExceptionHandler>();
        services.AddTransient(typeof(IRequestExceptionHandler<,,>), typeof(PublishExceptionHandlerDetails<,,>));

        IEnumerable<Assembly> assemblies = [assembly, .. additionalAssemblies];

        services
            .Scan(scan => scan
                .FromAssemblies(assemblies)
                .AddClasses(classes => classes
                    .AssignableTo<IExceptionHandler>()
                    .Where(type => !(type.IsAssignableTo(typeof(IExceptionHandlerAggregator)) 
                        || type.IsAssignableTo(typeof(IDefaultExceptionHandler)))))
                .AsImplementedInterfaces()
                .WithScopedLifetime());

        return services;
    }

    public static IServiceCollection AddApplicationUserProvider(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.TryAddTransient<IApplicationUserProvider, ApplicationUserProvider>();
        return services;
    }

    public static IServiceCollection AddSqlServerDbContext<TContext>(this IServiceCollection services, Action<SqlServerDbContextRegistrationOptions>? configOptions = null)
        where TContext : SqlServerDbContext<TContext>
    {
        SqlServerDbContextRegistrationOptions options = new();
        configOptions?.Invoke(options);

        services.AddSqlServerDbContextProviders<TContext>(options.ConfigureDbConnection);

        if (options.UseEntityChangesAuditing)
        {
            services.AddApplicationUserProvider();
            services.AddEntityAuditingServices<DbEntityAuditDetailsProvider>();
            services
              .AddOptions<DbEntityAuditDetailsProviderOptions>()
              .Configure(opt => options.ConfigureAuditing?.Invoke(opt));
        }

        if (options.UseEntityChangesPublishing)
        {
            services.AddEntityPublishingServices();
        }

        if (options.UseMediatRPipelineBehaviors)
        {
            if (options.UseValidateDbCommandsForDbWrites)
            {
                services.TryAddTransient(typeof(IPipelineBehavior<,>), typeof(RequestPreProcessorBehavior<,>));
                services.TryAddTransient(typeof(IRequestPreProcessor<>), typeof(ValidateDbCommandBehavior<>));
            }

            if (options.UseDbTransactionForDbWrites)
            {
                services.TryAddTransient(typeof(IPipelineBehavior<,>), typeof(UnitOfWorkBehavior<,>));
            }

            if (options.UseDisableChangeTrackingForDbReads)
            {
                services.TryAddTransient(typeof(IPipelineBehavior<,>), typeof(OptimizeQueryingBehavior<,>));
            }
        }

        services
            .AddDbContext<TContext>((provider, builder) =>
            {
                var connection = provider.GetRequiredService<IDbConnectionProvider>();
                builder.UseSqlServer(connection.DbConnection);

                if (options.UseEntityChangesAuditing)
                {
                    builder.AddAuditingInterceptor(provider);
                }
                if (options.UseEntityChangesPublishing)
                {
                    builder.AddPublishingInterceptor(provider);
                }
            });

        return services;
    }


}
