using ExcentOne.EntityFrameworkCore.Relational;
using ExcentOne.Persistence.Features.Models.Auditing;
using LinqKit;
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
            if (entityType.ClrType.IsAssignableTo(typeof(IDeleteAudit)))
            {
                var predicate = PredicateBuilder
                    .New<IDeleteAudit>(e => e.IsDeleted == false);

                modelBuilder
                    .Entity(entityType.ClrType)
                    .HasQueryFilter(predicate);
            }

        }
    }
}
