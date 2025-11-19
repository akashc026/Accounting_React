namespace ExcentOne.MediatR.EntityFrameworkCore.Exceptions;

public class EntityNotFoundException(Type entityType, object id) : Exception($"{entityType.Name} with ID {id} was not found.")
{
    public Type EntityType => entityType;
}
