using ExcentOne.Application.Features.Security;
using ExcentOne.EntityFrameworkCore.Auditing;
using Microsoft.Extensions.Options;

namespace ExcentOne.Application.Features.Auditing;

public class DbEntityAuditDetailsProvider(IApplicationUserProvider userProvider, IOptions<DbEntityAuditDetailsProviderOptions> options) : IDbEntityAuditDetailsProvider
{
    public AuditDetails AuditDetails => new(
        userProvider.CurrentUser.UserId,
        DateTime.SpecifyKind(options.Value.AuditDateTime ?? DateTime.Now, options.Value.DateTimeKind));
}
