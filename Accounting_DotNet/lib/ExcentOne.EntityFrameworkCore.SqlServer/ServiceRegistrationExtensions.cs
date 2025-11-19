using ExcentOne.EntityFrameworkCore.Relational;
using ExcentOne.Persistence.Features;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace ExcentOne.EntityFrameworkCore.SqlServer;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddSqlServerDb(this IServiceCollection services, string connectionName, Action<SqlServerDbOptions>? configureOptions = null, ServiceLifetime serviceLifetime = ServiceLifetime.Scoped) 
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionName);

        services
            .AddOptions<SqlServerDbOptions>()
            .Configure(options => configureOptions?.Invoke(options));

        services
            .AddScoped<IDbConnectionProvider>(provider =>
            {
                ArgumentNullException.ThrowIfNull(connectionName);

                var connectionString = provider
                    .GetRequiredService<IConfiguration>()
                    .GetConnectionString(connectionName) ??
                    throw new KeyNotFoundException($"Connection string with name {connectionName} was not found in app setings.");

                var connectionOptions = provider.GetRequiredService<IOptions<SqlServerDbOptions>>().Value;
      
                if (connectionOptions.ConfigureConnectionString is { } configure)
                {
                    SqlConnectionStringBuilder builder = new(connectionString);
                    configure(builder);
                    connectionString = builder.ConnectionString;
                }

                return new SqlServerDbConnectionProvider(connectionString);
            })
            .AddScoped<IDbTransactionProvider, SqlServerDbTransactionProvider>()
            .AddScoped<IUnitOfWork, SqlServerUnitOfWork>();

        return services;
    }

    public static IServiceCollection AddSqlServerDbContextProviders<TContext>(this IServiceCollection services, Action<SqlServerDatabaseOptions>? configOptions = null)
        where TContext : SqlServerDbContext<TContext>
    {
        services
            .TryAddScoped<IDbConnectionProvider>(provider =>
            {
                var options = provider.GetRequiredService<IOptions<SqlServerDatabaseOptions>>().Value;
                var configuration = provider.GetRequiredService<IConfiguration>();
                var connectionString = configuration.GetConnectionString(options.ConnectionName);

                if (connectionString is not { })
                {
                    throw new KeyNotFoundException($"Connection string with name {options.ConnectionName} was not found in app setings.");
                }

                if (options.ConfigureConnectionString is { } configure)
                {
                    SqlConnectionStringBuilder builder = new(connectionString);
                    configure(builder);
                    connectionString = builder.ConnectionString;
                }

                return new SqlServerDbConnectionProvider(connectionString);
            });
        services.TryAddScoped<IUnitOfWork, SqlServerUnitOfWork>();
        services.TryAddScoped<IDbTransactionProvider, SqlServerDbTransactionProvider>();
        services.TryAddScoped<IDbContextProvider, SqlServerDbContextProvider<TContext>>();
        services.TryAddScoped<IDbContextProvider<TContext>, SqlServerDbContextProvider<TContext>>();

        services
            .AddOptions<SqlServerDatabaseOptions>()
            .Configure(options => configOptions?.Invoke(options));

        return services;

    }

    public static DbContextOptionsBuilder UseSqlServerDb(this DbContextOptionsBuilder builder, IServiceProvider provider)
    {
        var connectionProvider = provider.GetRequiredService<IDbConnectionProvider>();
        builder.UseSqlServer(connectionProvider.DbConnection);

        return builder;
    }
}
