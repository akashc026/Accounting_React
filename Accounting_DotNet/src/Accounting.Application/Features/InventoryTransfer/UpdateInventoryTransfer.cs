using ExcentOne.Application.Features.Commands;
using System;

namespace Accounting.Application.Features
{
    public class UpdateInventoryTransfer : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public Guid? CustomerID { get; set; }

        public DateTime? TranDate { get; set; }

        public Guid? FromLocation { get; set; }

        public Guid? ToLocation { get; set; }

        public bool? IsInactive { get; set; }

        public string SequenceNumber { get; set; } = null!;

        public Guid Form { get; set; }
    }
}

