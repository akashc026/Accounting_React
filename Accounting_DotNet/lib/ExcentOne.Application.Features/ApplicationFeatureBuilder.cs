using ExcentOne.EntityFrameworkCore.SqlServer;
using Microsoft.Extensions.DependencyInjection;

namespace ExcentOne.Application.Features;

public abstract class ApplicationFeatureBuilder
{
    private IServiceCollection services;

    protected void AddSqlDbContext<TContext>() where TContext : SqlServerDbContext<TContext>
    {
        services.AddDbContext<TContext>()
    }


    protected void AddCommands()
    {

    }

    protected void AddQueries()
    {

    }

    protected void AddNotifications()
    {

    }

    internal void Initialize(IServiceCollection services) => this.services = services;
}
