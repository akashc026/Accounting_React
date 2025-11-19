using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class RecordTypeResultDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public int StandardFieldsCount { get; set; }


    }
} 