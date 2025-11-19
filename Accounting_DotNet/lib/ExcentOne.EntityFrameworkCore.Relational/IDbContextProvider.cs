using Microsoft.EntityFrameworkCore;

namespace ExcentOne.EntityFrameworkCore.Relational;

public interface IDbContextProvider
{
    DbContext DbContext { get; }
}

public interface IDbContextProvider<out TContext> : IDbContextProvider
    where TContext : DbContext
{
    new TContext DbContext { get; }
    DbContext IDbContextProvider.DbContext => DbContext;
}
