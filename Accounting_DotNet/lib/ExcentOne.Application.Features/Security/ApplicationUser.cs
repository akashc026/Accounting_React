using System.Security.Claims;

namespace ExcentOne.Application.Features.Security;

public class ApplicationUser(ClaimsPrincipal? claimsPrincipal)
{
    public static readonly string DefaultUserName = typeof(ApplicationUser).Name;

    public static readonly ApplicationUser Current = new();

    public ApplicationUser() : this(ClaimsPrincipal.Current)
    {
    }

    public IEnumerable<Claim> Claims => claimsPrincipal?.Claims.Select(c => c.Clone()) ?? [];
    public string UserId => claimsPrincipal?.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    public string UserName => claimsPrincipal?.FindFirstValue(ClaimTypes.Name) ?? DefaultUserName;
    public string UserTenant => claimsPrincipal?.FindFirstValue(UserClaimTypes.Tenant) ?? string.Empty;
    public bool IsAuthenticated => claimsPrincipal?.Identities.Any(i => i.IsAuthenticated) ?? false;

    public static class UserClaimTypes
    {
        public const string Tenant = "tenant";
    }
}
