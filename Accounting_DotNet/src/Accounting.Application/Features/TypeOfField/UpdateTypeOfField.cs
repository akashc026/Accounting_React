using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateTypeOfField : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }
        public bool? IsDeleted { get; set; }

        public string? ComponentName { get; set; }

        public string? PackageName { get; set; }

        public string? Category { get; set; }

        public string? Description { get; set; }
    }
} 
