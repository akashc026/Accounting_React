namespace ExcentOne.Application.Features.Auditing;

public class DbEntityAuditDetailsProviderOptions
{
    public DateTimeKind DateTimeKind { get; set; } = DateTimeKind.Local;
    public DateTime? AuditDateTime { get; set; }
}
