using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CustomFieldValueResultDto
    {
        public Guid ID { get; set; }

        public string? RecordID { get; set; }

        public Guid TypeOfRecord { get; set; }

        public string ValueText { get; set; } = null!;

        public Guid CustomFieldID { get; set; }

        public string CustomFieldName { get; set; } = null!;

        public string TypeOfRecordName { get; set; } = null!;
    }
} 