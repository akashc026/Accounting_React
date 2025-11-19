using ExcentOne.EntityFrameworkCore.Relational;
using ExcentOne.Persistence.Features;
using System.Data;
using System.Data.Common;

namespace ExcentOne.EntityFrameworkCore.SqlServer;

public class SqlServerUnitOfWork(
    IDbConnectionProvider connectionProvider,
    IDbTransactionProvider transactionProvider) : IUnitOfWork, IDisposable
{
    private bool disposedValue;

    public async Task BeginAsync(CancellationToken cancellationToken = default)
    {
        var connection = connectionProvider.DbConnection;

        if (connection.State is ConnectionState.Closed)
        {
            await connection.OpenAsync(cancellationToken);
        }

        if (connection.State is ConnectionState.Open)
        {
            await transactionProvider.BeginTransactionAsync(cancellationToken);
        }
    }

    public async Task CommitAsync(CancellationToken cancellationToken = default)
    {
        var connection = connectionProvider.DbConnection;

        if (transactionProvider.CurrentTransaction is { } transaction)
        {
            await transaction.CommitAsync(cancellationToken);
            await connection.CloseAsync();
            return;
        }

        throw new InvalidOperationException("Unit of work has not yet begun; no work to commit.");
    }

    public async Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        var connection = connectionProvider.DbConnection;

        if (transactionProvider.CurrentTransaction is { } transaction)
        {
            await transaction.RollbackAsync(cancellationToken);
            await connection.CloseAsync();
            return;
        }

        throw new InvalidOperationException("Unit of work has not yet begun; no work to rollback.");
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!disposedValue)
        {
            if (disposing)
            {
                // TODO: dispose managed state (managed objects)
                if (transactionProvider.CurrentTransaction is { } transaction)
                {
                    transaction.Dispose();
                }
                if (connectionProvider.DbConnection is { } connection)
                {
                    connection.Dispose();
                }
            }

            // TODO: free unmanaged resources (unmanaged objects) and override finalizer
            // TODO: set large fields to null
            disposedValue = true;
        }
    }

     //// TODO: override finalizer only if 'Dispose(bool disposing)' has code to free unmanaged resources
     //~SqlServerUnitOfWork()
     //{
     //    // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
     //    Dispose(disposing: false);
     //}

    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }
}
