using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateStandardField : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public Guid TypeOfRecord { get; set; }

        public Guid FieldType { get; set; }

        public bool IsMandatory { get; set; }

        public bool IsDisabled { get; set; }

        public string Source { get; set; } = null!;

        public int DisplayOrder { get; set; }

        public string? Label { get; set; }
    }
} 