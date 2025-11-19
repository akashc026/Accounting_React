using ExcentOne.Application.Features.Commands;
using System;

namespace Accounting.Application.Features
{
    public class UpdateInventoryAdjustment : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public Guid? Customer { get; set; }

        public DateTime? TranDate { get; set; }

        public Guid? Location { get; set; }

        public bool? IsInactive { get; set; }

        public string SequenceNumber { get; set; } = null!;

        public Guid Form { get; set; }
    }
}

