using System;
using System.Linq.Expressions;
using ExcentOne.EntityFrameworkCore.Relational;
using ExcentOne.Persistence.Features.Models.Auditing;
using Microsoft.EntityFrameworkCore;

namespace ExcentOne.EntityFrameworkCore.SqlServer;

public abstract class SqlServerDbContext<TContext> : DbContext
    where TContext : SqlServerDbContext<TContext>
{
    protected SqlServerDbContext(
        DbContextOptions<TContext> options,
        IDbTransactionProvider transactionProvider) : 
        base(options)
    {
        Database.UseTransaction(transactionProvider.CurrentTransaction);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ExcludeSoftDeletedEntities(modelBuilder);
        base.OnModelCreating(modelBuilder);
    }

    private static void ExcludeSoftDeletedEntities(ModelBuilder modelBuilder)
    {
        var deletableEntityTypes = modelBuilder.Model.GetEntityTypes();
        foreach (var entityType in deletableEntityTypes)
        {
            var queryFilter = BuildSoftDeleteFilter(entityType.ClrType);
            if (queryFilter is null)
            {
                continue;
            }

            modelBuilder
                .Entity(entityType.ClrType)
                .HasQueryFilter(queryFilter);
        }
    }

    private static LambdaExpression? BuildSoftDeleteFilter(Type entityType)
    {
        var parameter = Expression.Parameter(entityType, "entity");
        Expression? propertyAccess = null;

        if (entityType.IsAssignableTo(typeof(IDeleteAudit)))
        {
            propertyAccess = Expression.Property(
                Expression.Convert(parameter, typeof(IDeleteAudit)),
                nameof(IDeleteAudit.IsDeleted));
        }

        if (propertyAccess is null)
        {
            var propertyInfo = entityType.GetProperty(nameof(IDeleteAudit.IsDeleted));
            if (propertyInfo is not null && propertyInfo.PropertyType == typeof(bool))
            {
                propertyAccess = Expression.Property(parameter, propertyInfo);
            }
        }

        if (propertyAccess is null)
        {
            return null;
        }

        var condition = Expression.Equal(propertyAccess, Expression.Constant(false));
        return Expression.Lambda(condition, parameter);
    }
}
