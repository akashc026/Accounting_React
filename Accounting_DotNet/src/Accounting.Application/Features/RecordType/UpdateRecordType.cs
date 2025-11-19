using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateRecordType : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;
    }
} 