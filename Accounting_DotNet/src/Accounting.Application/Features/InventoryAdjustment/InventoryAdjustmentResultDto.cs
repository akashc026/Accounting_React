using System;

namespace Accounting.Application.Features
{
    public class InventoryAdjustmentResultDto
    {
        public Guid Id { get; set; }

        public Guid? Customer { get; set; }

        public string? CustomerName { get; set; }

        public DateTime? TranDate { get; set; }

        public Guid? Location { get; set; }

        public string? LocationName { get; set; }

        public bool? IsInactive { get; set; }

        public string SequenceNumber { get; set; } = null!;

        public Guid Form { get; set; }

        public string? FormName { get; set; }

        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





}
