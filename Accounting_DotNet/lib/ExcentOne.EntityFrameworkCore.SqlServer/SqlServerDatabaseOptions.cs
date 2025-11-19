using Microsoft.Data.SqlClient;
using System.Data;

namespace ExcentOne.EntityFrameworkCore.SqlServer;

public class SqlServerDatabaseOptions
{
    public const string DefaultConnectionName = "DefaultConnection";
    public string ConnectionName { get; set; } = DefaultConnectionName;
    public Action<SqlConnectionStringBuilder>? ConfigureConnectionString { get; set; }
    public IsolationLevel IsolationLevel { get; set; } = IsolationLevel.ReadCommitted;
}
