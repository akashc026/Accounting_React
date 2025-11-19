using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateCustomFormField : IUpdateEntity<Guid, Guid>
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
    }
} 