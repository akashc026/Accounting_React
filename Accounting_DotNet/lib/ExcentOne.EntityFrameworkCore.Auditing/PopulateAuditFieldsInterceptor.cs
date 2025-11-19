using ExcentOne.EntityFrameworkCore.Auditing.Internal;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;
using ExcentOne.Reflection.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace ExcentOne.EntityFrameworkCore.Auditing;

public class PopulateAuditFieldsInterceptor(IDbEntityAuditDetailsProvider auditDetailsProvider) : SaveChangesInterceptor
{
    private void PopulateAuditFields(DbContextEventData eventData)
    {
        if (eventData.Context is not DbContext context)
        {
            return;
        }

        var targetEntities = context.ChangeTracker.Entries()
            .Where(e => e.Entity is IConcurrency && e.Entity is IEntity);

        var auditInfo = auditDetailsProvider.AuditDetails;

        foreach (var entry in targetEntities)
        {
            var propertyEntry = entry.Property(nameof(IEntity.Id));
            object? defaultIdValue = DefaultValuesCache.NewOrDefault(propertyEntry.Metadata.ClrType);
            object? entityId = propertyEntry.CurrentValue;

            bool isDeleted = entry.Entity is IDeleteAudit deleted && deleted.IsDeleted;

            if (entityId == defaultIdValue && isDeleted)
            {
                entry.State = EntityState.Detached;
            }
            else if ((isDeleted || entry.State == EntityState.Deleted) && entry.Entity is IDeleteAudit)
            {
                entry.State = EntityState.Modified;

                entry.Property(nameof(IDeleteAudit.IsDeleted)).CurrentValue = true;
                entry.Property(nameof(IDeleteAudit.DeletedBy)).CurrentValue = auditInfo.UserId;
                entry.Property(nameof(IDeleteAudit.DeletedDate)).CurrentValue = auditInfo.Timestamp;

                entry.Modified<IDeleteAudit>();
                entry.NotModified<ICreateAudit>();
                entry.NotModified<IUpdateAudit>();
            }
            else if (entry.State == EntityState.Modified && entry.Entity is IUpdateAudit)
            {
                entry.State = EntityState.Modified;

                entry.Property(nameof(IUpdateAudit.UpdatedBy)).CurrentValue = auditInfo.UserId;
                entry.Property(nameof(IUpdateAudit.UpdatedDate)).CurrentValue = auditInfo.Timestamp;

                entry.Modified<IUpdateAudit>();
                entry.NotModified<ICreateAudit>();
                entry.NotModified<IDeleteAudit>();
            }
            else if (entry.State == EntityState.Added && entry.Entity is ICreateAudit)
            {
                entry.Property(nameof(ICreateAudit.CreatedBy)).CurrentValue = auditInfo.UserId;
                entry.Property(nameof(ICreateAudit.CreatedDate)).CurrentValue = auditInfo.Timestamp;

                entry.Modified<ICreateAudit>();
                entry.NotModified<IUpdateAudit>();
                entry.NotModified<IDeleteAudit>();
            }
        }

    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        PopulateAuditFields(eventData);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        PopulateAuditFields(eventData);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
