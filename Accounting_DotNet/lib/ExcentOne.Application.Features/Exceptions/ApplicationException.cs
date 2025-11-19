namespace ExcentOne.Application.Features.Exceptions;

public class ApplicationException : Exception
{
    public ApplicationException() : this("An application error has occured.")
    {
    }

    public ApplicationException(string? message) : base(message)
    {
    }

    public ApplicationException(string? message, Exception? innerException) : base(message, innerException)
    {
    }
}
