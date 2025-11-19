using ExcentOne.Application.Features.Validation;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using Microsoft.Extensions.DependencyInjection;

namespace ExcentOne.Presentation.Features;

public static class MediatRServiceConfigurationExtensions
{
    public static MediatRServiceConfiguration AddDbTransactionBehaviorForDbWrites(this MediatRServiceConfiguration config, ServiceLifetime serviceLifetime = ServiceLifetime.Scoped)
    {
        return config.AddOpenBehavior(typeof(UnitOfWorkBehavior<,>), serviceLifetime);
    }

    public static MediatRServiceConfiguration AddDisableChangeTrackingBehaviorForDbReads(this MediatRServiceConfiguration config, ServiceLifetime serviceLifetime = ServiceLifetime.Scoped)
    {
        return config.AddOpenBehavior(typeof(OptimizeQueryingBehavior<,>), serviceLifetime);
    }

    public static MediatRServiceConfiguration AddValidateDbCommandPreProcessorForDbWrites(this MediatRServiceConfiguration config, ServiceLifetime serviceLifetime = ServiceLifetime.Scoped)
    {
        return config.AddOpenRequestPreProcessor(typeof(ValidateDbCommandBehavior<>), serviceLifetime);
    }
}
