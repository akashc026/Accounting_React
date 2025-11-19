using ExcentOne.EntityFrameworkCore.Relational;
using Microsoft.Data.SqlClient;

namespace ExcentOne.EntityFrameworkCore.SqlServer;

public class SqlServerDbConnectionProvider(string connectionString) : IDbConnectionProvider<SqlConnection>
{
    private readonly Lazy<SqlConnection> dbConnectionFactory = new(() => new(connectionString));
    public SqlConnection DbConnection => dbConnectionFactory.Value;
}
