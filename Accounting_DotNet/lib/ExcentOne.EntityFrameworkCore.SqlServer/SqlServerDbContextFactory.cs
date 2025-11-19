using ExcentOne.EntityFrameworkCore.Relational;
using Microsoft.EntityFrameworkCore;

namespace ExcentOne.EntityFrameworkCore.SqlServer;

public class SqlServerDbContextFactory<TContext>(
    IDbConnectionProvider connectionProvider, 
    IDbTransactionProvider dbTransaction) : IDbContextFactory<TContext>
    where TContext : DbContext
{
    public async Task<TContext> CreateDbContextAsync(CancellationToken cancellationToken)
    {
        DbContextOptionsBuilder<TContext> builder = new();

        builder.UseSqlServer(connectionProvider.DbConnection);

        TContext context = (TContext)Activator.CreateInstance(typeof(TContext), builder)!;

        context.Database.UseTransactionAsync(cancellationToken)

        return context;
    }
}
