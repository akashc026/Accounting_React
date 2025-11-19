using ExcentOne.EntityFrameworkCore.Relational;
using Microsoft.EntityFrameworkCore;

namespace ExcentOne.EntityFrameworkCore.SqlServer;

public class SqlServerDbContextProvider<TContext>(TContext context) : IDbContextProvider<TContext>
    where TContext : DbContext
{
    public TContext DbContext => context;
}
