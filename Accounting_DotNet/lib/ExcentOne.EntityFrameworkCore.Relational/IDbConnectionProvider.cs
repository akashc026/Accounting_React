using System.Data.Common;

namespace ExcentOne.EntityFrameworkCore.Relational;

public interface IDbConnectionProvider
{
    DbConnection DbConnection { get; }
}

public interface IDbConnectionProvider<TConnection> : IDbConnectionProvider
    where TConnection : DbConnection
{
    new TConnection DbConnection { get; }
    DbConnection IDbConnectionProvider.DbConnection => DbConnection;
}
