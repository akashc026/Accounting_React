using Microsoft.Data.SqlClient;
using System.Data;

namespace ExcentOne.EntityFrameworkCore.SqlServer;

public class SqlServerDbOptions(string connectionName = SqlServerDbOptions.DefaultConnectionName)
{
    public const string DefaultConnectionName = "DefaultConnection";
    public string ConnectionName { get; } = connectionName;
    public Action<SqlConnectionStringBuilder>? ConfigureConnectionString { get; set; }
    public IsolationLevel IsolationLevel { get; set; } = IsolationLevel.ReadCommitted;
}
