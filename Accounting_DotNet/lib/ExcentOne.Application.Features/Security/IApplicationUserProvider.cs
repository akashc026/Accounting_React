namespace ExcentOne.Application.Features.Security;

public interface IApplicationUserProvider
{
    ApplicationUser CurrentUser { get; }
}
