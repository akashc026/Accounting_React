using System;

namespace Accounting.Application.Features
{
    public class InventoryTransferResultDto
    {
        public Guid Id { get; set; }

        public Guid? CustomerID { get; set; }
        public string? CustomerName { get; set; }

        public DateTime? TranDate { get; set; }

        public Guid? FromLocation { get; set; }
        public string? FromLocationName { get; set; }

        public Guid? ToLocation { get; set; }
        public string? ToLocationName { get; set; }

        public bool? IsInactive { get; set; }

        public string SequenceNumber { get; set; } = null!;

        public Guid Form { get; set; }
        public string? FormName { get; set; }

        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





}
