using ExcentOne.Application.Features.Security;
using Microsoft.AspNetCore.Http;

namespace ExcentOne.Presentation.Features.Security;

public class ApplicationUserProvider(IHttpContextAccessor accessor) : IApplicationUserProvider
{
    public ApplicationUser CurrentUser 
    { 
        get
        {
            if (accessor.HttpContext is { } context)
            {
                return new(context.User);
            }

            return ApplicationUser.Current;
        }
    }
}
