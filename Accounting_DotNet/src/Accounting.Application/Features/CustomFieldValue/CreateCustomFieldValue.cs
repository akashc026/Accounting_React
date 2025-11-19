using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateCustomFieldValue : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public string? RecordID { get; set; }

        public Guid TypeOfRecord { get; set; }

        public string ValueText { get; set; } = null!;

        public Guid CustomFieldID { get; set; }
    }
} 