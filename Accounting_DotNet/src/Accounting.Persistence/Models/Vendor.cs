using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class Vendor : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? Address { get; set; }

    public bool? Inactive { get; set; }

    public string? Notes { get; set; }

    public Guid? Form { get; set; }

    public string? SequenceNumber { get; set; }

    public virtual Form? FormNavigation { get; set; }

    public virtual ICollection<ItemReceipt> ItemReceipts { get; set; } = new List<ItemReceipt>();

    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();

    public virtual ICollection<VendorBill> VendorBills { get; set; } = new List<VendorBill>();

    public virtual ICollection<VendorCredit> VendorCredits { get; set; } = new List<VendorCredit>();

    public virtual ICollection<VendorPayment> VendorPayments { get; set; } = new List<VendorPayment>();
}
