namespace ExcentOne.MediatR.EntityFrameworkCore.Command;

public class DbCommmandException(IDbCommand command, Exception? inner) : Exception($"An exception has occurred while performing {command.GetType().Name} command. See inner exception for details.", inner)
{
    public IDbCommand Command { get; } = command;
}
