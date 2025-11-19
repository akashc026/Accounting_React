using ExcentOne.Persistence.Features.Models;

namespace ExcentOne.Persistence.Features;

public interface IDataOperation
{
}

public interface IDataOperation<TEntity> 
    where TEntity : IEntity
{
}
