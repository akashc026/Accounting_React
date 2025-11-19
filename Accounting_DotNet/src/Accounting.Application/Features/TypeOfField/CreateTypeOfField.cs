using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateTypeOfField : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public string ComponentName { get; set; } = null!;

        public string PackageName { get; set; } = null!;

        public string Category { get; set; } = null!;

        public string? Description { get; set; }
    }
} 