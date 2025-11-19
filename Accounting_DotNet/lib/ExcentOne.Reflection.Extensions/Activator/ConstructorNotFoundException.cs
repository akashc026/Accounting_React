namespace ExcentOne.Reflection.Extensions.Activator;

public class ConstructorNotFoundException(Type type, params Type[] argTypes) : 
    Exception($"Constructor for type {type.FullName} with parameters {string.Join(", ", argTypes.Select(t => t.FullName))} was not found.")
{
    public Type TypeToConstruct => type;
    public Type[] ConstructorParameters => argTypes;
}
