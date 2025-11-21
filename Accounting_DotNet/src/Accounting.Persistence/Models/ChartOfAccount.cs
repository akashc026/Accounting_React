using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class ChartOfAccount : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string AccountNumber { get; set; } = null!;

    public decimal? OpeningBalance { get; set; }

    public bool? Inactive { get; set; }

    public string? Notes { get; set; }

    public string? ParentNumber { get; set; }

    public bool? IsParent { get; set; }

    public Guid? Parent { get; set; }

    public Guid? AccountType { get; set; }

    public decimal? RunningBalance { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual AccountType? AccountTypeNavigation { get; set; }

    public virtual ICollection<Form> FormAccountPayableNavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormAccountReceivableNavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormAccuredARNavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormAccuredTaxNavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormClearingGRNINavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormClearingNavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormClearingSRNINavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormClearingVATNavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormDiscountOnTaxCRNavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormDiscountOnTaxDRNavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormDiscountOnTaxNavigations { get; set; } = new List<Form>();

    public virtual ICollection<Form> FormUndepositedFundsNavigations { get; set; } = new List<Form>();

    public virtual ICollection<ChartOfAccount> InverseParentNavigation { get; set; } = new List<ChartOfAccount>();

    public virtual ICollection<JournalEntryLine> JournalEntryLines { get; set; } = new List<JournalEntryLine>();

    public virtual ChartOfAccount? ParentNavigation { get; set; }

    public virtual ICollection<Product> ProductCOGSAccountNavigations { get; set; } = new List<Product>();

    public virtual ICollection<Product> ProductExpenseAccountNavigations { get; set; } = new List<Product>();

    public virtual ICollection<Product> ProductInventoryAccountNavigations { get; set; } = new List<Product>();

    public virtual ICollection<Product> ProductSalesAccountNavigations { get; set; } = new List<Product>();

    public virtual ICollection<Tax> Taxes { get; set; } = new List<Tax>();
}
