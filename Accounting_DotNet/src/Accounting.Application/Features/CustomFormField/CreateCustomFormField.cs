using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateCustomFormField : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public string FieldName { get; set; } = null!;

        public string FieldLabel { get; set; } = null!;

        public bool? IsRequired { get; set; }

        public bool? IsDisabled { get; set; }

        public string? FieldSource { get; set; }

        public int DisplayOrder { get; set; }

        public Guid? FormId { get; set; }

        public Guid? FieldType { get; set; }

        public string? CreatedBy { get; set; }
    }
} 
