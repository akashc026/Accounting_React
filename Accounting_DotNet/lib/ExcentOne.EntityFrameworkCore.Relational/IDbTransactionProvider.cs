using System.Data.Common;

namespace ExcentOne.EntityFrameworkCore.Relational;

public interface IDbTransactionProvider
{
    DbTransaction? CurrentTransaction { get; }
    ValueTask<DbTransaction> BeginTransactionAsync(CancellationToken cancellation);
}
