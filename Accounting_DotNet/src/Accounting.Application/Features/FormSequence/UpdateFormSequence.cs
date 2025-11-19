using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateFormSequence : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public Guid FormId { get; set; }

        public int FormSequenceNumber { get; set; }
    }
} 