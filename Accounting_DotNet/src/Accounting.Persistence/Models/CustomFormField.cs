using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class CustomFormField : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public string FieldName { get; set; } = null!;

    public string FieldLabel { get; set; } = null!;

    public bool? IsRequired { get; set; }

    public bool? IsDisabled { get; set; }

    public string? FieldSource { get; set; }

    public int DisplayOrder { get; set; }

    public Guid? FormId { get; set; }

    public Guid? FieldType { get; set; }

    public virtual ICollection<CustomFieldValue> CustomFieldValues { get; set; } = new List<CustomFieldValue>();

    public virtual TypeOfField? FieldTypeNavigation { get; set; }

    public virtual Form? Form { get; set; }
}
