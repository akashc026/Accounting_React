using ExcentOne.EntityFrameworkCore.Relational;
using Microsoft.Extensions.Options;
using System.Data;
using System.Data.Common;

namespace ExcentOne.EntityFrameworkCore.SqlServer;

public class SqlServerDbTransactionProvider(IDbConnectionProvider connectionProvider, IOptions<SqlServerDatabaseOptions> options) : IDbTransactionProvider
{
    private DbTransaction? dbTransaction;
    public DbTransaction? CurrentTransaction => dbTransaction;

    public async ValueTask<DbTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (connectionProvider.DbConnection is not { } dbConnection)
        {
            throw new InvalidOperationException("No database connection found.");
        }

        if (dbConnection.State != ConnectionState.Open)
        {
            throw new InvalidOperationException("Database connection is not yet opened.");
        }

        if (dbTransaction is null)
        {
            var isolationLevel = options.Value.IsolationLevel;
            dbTransaction = await dbConnection.BeginTransactionAsync(isolationLevel, cancellationToken);
        }

        return dbTransaction;
    }
}
