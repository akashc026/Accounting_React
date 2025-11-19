using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CustomFormFieldResultDto
    {
        public Guid Id { get; set; }

        public string FieldName { get; set; } = null!;

        public string FieldLabel { get; set; } = null!;

        public bool? IsRequired { get; set; }

        public bool? IsDisabled { get; set; }

        public string? FieldSource { get; set; }

        public int DisplayOrder { get; set; }

        public Guid? FormId { get; set; }

        public string? FormName { get; set; }

        public Guid? FieldType { get; set; }

        public string? FieldTypeName { get; set; }
    }
} 