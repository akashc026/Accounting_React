using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace ExcentOne.EntityFrameworkCore.Auditing.Internal;

internal static class EntityEntryExtensions
{
    public static EntityEntry IsModified<T>(this EntityEntry entry, bool isModified)
    {
        if (entry.Entity is not T)
        {
            return entry;
        }

        var properties = typeof(T).GetProperties();
        foreach (var property in properties)
        {
            entry.Property(property.Name).IsModified = isModified;
        }

        return entry;
    }

    public static EntityEntry Modified<T>(this EntityEntry entry) => IsModified<T>(entry, true);
    public static EntityEntry NotModified<T>(this EntityEntry entry) => IsModified<T>(entry, false);
}
