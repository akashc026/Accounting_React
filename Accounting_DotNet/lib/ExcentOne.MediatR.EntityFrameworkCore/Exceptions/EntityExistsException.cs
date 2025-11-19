using ExcentOne.Persistence.Features.Models;

namespace ExcentOne.MediatR.EntityFrameworkCore.Exceptions;

public class EntityExistsException(IEntity entity) : Exception($"{entity.GetType().Name} with ID {entity.Id} already exists.")
{
    public IEntity Entity => entity;
}
