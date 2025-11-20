using System;
using System.Collections.Generic;
using Accounting.Persistence.Models;
using ExcentOne.EntityFrameworkCore.Relational;
using ExcentOne.EntityFrameworkCore.SqlServer;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Persistence;

public partial class AccountingDbContext : SqlServerDbContext<AccountingDbContext>
{
    public AccountingDbContext(DbContextOptions<AccountingDbContext> options, IDbTransactionProvider provider)
        : base(options, provider)
    {
    }

    public virtual DbSet<AccountType> AccountTypes { get; set; }

    public virtual DbSet<ChartOfAccount> ChartOfAccounts { get; set; }

    public virtual DbSet<CreditMemo> CreditMemos { get; set; }

    public virtual DbSet<CreditMemoLine> CreditMemoLines { get; set; }

    public virtual DbSet<CreditMemoPaymentLine> CreditMemoPaymentLines { get; set; }

    public virtual DbSet<CustomFieldValue> CustomFieldValues { get; set; }

    public virtual DbSet<CustomFormField> CustomFormFields { get; set; }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<CustomerPayment> CustomerPayments { get; set; }

    public virtual DbSet<CustomerPaymentLine> CustomerPaymentLines { get; set; }

    public virtual DbSet<DebitMemo> DebitMemos { get; set; }

    public virtual DbSet<DebitMemoLine> DebitMemoLines { get; set; }

    public virtual DbSet<Form> Forms { get; set; }

    public virtual DbSet<FormSequence> FormSequences { get; set; }

    public virtual DbSet<FormSourceType> FormSourceTypes { get; set; }

    public virtual DbSet<InventoryAdjustment> InventoryAdjustments { get; set; }

    public virtual DbSet<InventoryAdjustmentLine> InventoryAdjustmentLines { get; set; }

    public virtual DbSet<InventoryDetail> InventoryDetails { get; set; }

    public virtual DbSet<InventoryLedger> InventoryLedgers { get; set; }

    public virtual DbSet<InventoryTransfer> InventoryTransfers { get; set; }

    public virtual DbSet<InventoryTransferLine> InventoryTransferLines { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<InvoiceFulFillMentLink> InvoiceFulFillMentLinks { get; set; }

    public virtual DbSet<InvoiceLine> InvoiceLines { get; set; }

    public virtual DbSet<ItemFulfilment> ItemFulfilments { get; set; }

    public virtual DbSet<ItemFulfilmentLine> ItemFulfilmentLines { get; set; }

    public virtual DbSet<ItemReceipt> ItemReceipts { get; set; }

    public virtual DbSet<ItemReceiptLine> ItemReceiptLines { get; set; }

    public virtual DbSet<ItemType> ItemTypes { get; set; }

    public virtual DbSet<JournalEntry> JournalEntries { get; set; }

    public virtual DbSet<JournalEntryLine> JournalEntryLines { get; set; }

    public virtual DbSet<Location> Locations { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductStock> ProductStocks { get; set; }

    public virtual DbSet<PurchaseOrder> PurchaseOrders { get; set; }

    public virtual DbSet<PurchaseOrderLine> PurchaseOrderLines { get; set; }

    public virtual DbSet<RecordType> RecordTypes { get; set; }

    public virtual DbSet<SalesOrder> SalesOrders { get; set; }

    public virtual DbSet<SalesOrderLine> SalesOrderLines { get; set; }

    public virtual DbSet<SalesOrderNumberSequence> SalesOrderNumberSequences { get; set; }

    public virtual DbSet<StandardField> StandardFields { get; set; }

    public virtual DbSet<Status> Statuses { get; set; }

    public virtual DbSet<Tax> Taxes { get; set; }

    public virtual DbSet<TransactionStatus> TransactionStatuses { get; set; }

    public virtual DbSet<TypeOfField> TypeOfFields { get; set; }

    public virtual DbSet<Vendor> Vendors { get; set; }

    public virtual DbSet<VendorBill> VendorBills { get; set; }

    public virtual DbSet<VendorBillLine> VendorBillLines { get; set; }

    public virtual DbSet<VendorCredit> VendorCredits { get; set; }

    public virtual DbSet<VendorCreditLine> VendorCreditLines { get; set; }

    public virtual DbSet<VendorCreditPaymentLine> VendorCreditPaymentLines { get; set; }

    public virtual DbSet<VendorPayment> VendorPayments { get; set; }

    public virtual DbSet<VendorPaymentLine> VendorPaymentLines { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AccountType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AccountT__3214EC078E13FCD9");

            entity.ToTable("AccountType");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(50);
        });

        modelBuilder.Entity<ChartOfAccount>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChartOfA__3214EC07D6F061E0");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.AccountNumber).HasMaxLength(50);
            entity.Property(e => e.IsParent).HasDefaultValue(false);
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.OpeningBalance).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ParentNumber).HasMaxLength(50);
            entity.Property(e => e.RunningBalance).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.AccountTypeNavigation).WithMany(p => p.ChartOfAccounts)
                .HasForeignKey(d => d.AccountType)
                .HasConstraintName("FK_ChartOfAccounts_AccountType");

            entity.HasOne(d => d.ParentNavigation).WithMany(p => p.InverseParentNavigation)
                .HasForeignKey(d => d.Parent)
                .HasConstraintName("FK_ChartOfAccounts_Parent");
        });

        modelBuilder.Entity<CreditMemo>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CreditMe__3214EC07971BA87C");

            entity.ToTable("CreditMemo");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Applied).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GrossAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.NetTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SequenceNumber).HasMaxLength(50);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TranDate).HasColumnType("date");
            entity.Property(e => e.UnApplied).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Customer).WithMany(p => p.CreditMemos)
                .HasForeignKey(d => d.CustomerID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CreditMemo_Customer");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.CreditMemos)
                .HasForeignKey(d => d.Form)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CreditMemo_Form");

            entity.HasOne(d => d.Location).WithMany(p => p.CreditMemos)
                .HasForeignKey(d => d.LocationID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CreditMemo_Location");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.CreditMemos)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_CreditMemo_Status");
        });

        modelBuilder.Entity<CreditMemoLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CreditMe__3214EC07BF154E03");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxPercent).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.CM).WithMany(p => p.CreditMemoLines)
                .HasForeignKey(d => d.CMID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CreditMemoLines_CMID");

            entity.HasOne(d => d.Item).WithMany(p => p.CreditMemoLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CreditMemoLines_Item");

            entity.HasOne(d => d.Tax).WithMany(p => p.CreditMemoLines)
                .HasForeignKey(d => d.TaxID)
                .HasConstraintName("FK_CreditMemoLines_Tax");
        });

        modelBuilder.Entity<CreditMemoPaymentLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CreditMe__3214EC07521E9024");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreditMemoSeqNum).HasMaxLength(50);
            entity.Property(e => e.MainRecordAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.RecordID).HasMaxLength(50);
            entity.Property(e => e.RecordType).HasMaxLength(50);
            entity.Property(e => e.RefNo).HasMaxLength(50);

            entity.HasOne(d => d.CM).WithMany(p => p.CreditMemoPaymentLines)
                .HasForeignKey(d => d.CMID)
                .HasConstraintName("FK_CreditMemoPaymentLines_CreditMemo");
        });

        modelBuilder.Entity<CustomFieldValue>(entity =>
        {
            entity.HasKey(e => e.ID).HasName("PK__CustomFi__3214EC27D8F72545");

            entity.Property(e => e.ID).HasDefaultValueSql("(newid())");
            entity.Property(e => e.RecordID).HasMaxLength(50);
            entity.Property(e => e.ValueText).HasMaxLength(255);

            entity.HasOne(d => d.CustomField).WithMany(p => p.CustomFieldValues)
                .HasForeignKey(d => d.CustomFieldID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CustomFieldValues_CustomFieldID");

            entity.HasOne(d => d.TypeOfRecordNavigation).WithMany(p => p.CustomFieldValues)
                .HasForeignKey(d => d.TypeOfRecord)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CustomFieldValues_TypeOfRecord");
        });

        modelBuilder.Entity<CustomFormField>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CustomFo__3214EC078A5FE181");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.FieldLabel).HasMaxLength(50);
            entity.Property(e => e.FieldName).HasMaxLength(50);
            entity.Property(e => e.FieldSource).HasMaxLength(50);
            entity.Property(e => e.IsDisabled).HasDefaultValue(false);
            entity.Property(e => e.IsRequired).HasDefaultValue(false);

            entity.HasOne(d => d.FieldTypeNavigation).WithMany(p => p.CustomFormFields)
                .HasForeignKey(d => d.FieldType)
                .HasConstraintName("FK_CustomFormFields_FieldType");

            entity.HasOne(d => d.Form).WithMany(p => p.CustomFormFields)
                .HasForeignKey(d => d.FormId)
                .HasConstraintName("FK_CustomFormFields_Forms");
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Customer__3214EC074189C59F");

            entity.ToTable("Customer");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Address).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.SequenceNumber).HasMaxLength(50);

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.Customers)
                .HasForeignKey(d => d.Form)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Customer_Forms");
        });

        modelBuilder.Entity<CustomerPayment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Customer__3214EC073AC6BC74");

            entity.ToTable("CustomerPayment");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.AppliedAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentDate).HasColumnType("date");
            entity.Property(e => e.SequenceNumber).HasMaxLength(50);
            entity.Property(e => e.UnAppliedAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.CustomerNavigation).WithMany(p => p.CustomerPayments)
                .HasForeignKey(d => d.Customer)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CustomerPayment_Customer");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.CustomerPayments)
                .HasForeignKey(d => d.Form)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CustomerPayment_Form");

            entity.HasOne(d => d.LocationNavigation).WithMany(p => p.CustomerPayments)
                .HasForeignKey(d => d.Location)
                .HasConstraintName("FK_CustomerPayment_Location");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.CustomerPayments)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_CustomerPayment_Status");
        });

        modelBuilder.Entity<CustomerPaymentLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Customer__3214EC0754DE5A79");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.IsApplied).HasDefaultValue(false);
            entity.Property(e => e.MainRecordAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentSeqNum).HasMaxLength(50);
            entity.Property(e => e.RecordID).HasMaxLength(50);
            entity.Property(e => e.RecordType).HasMaxLength(50);
            entity.Property(e => e.RefNo).HasMaxLength(50);

            entity.HasOne(d => d.Payment).WithMany(p => p.CustomerPaymentLines)
                .HasForeignKey(d => d.PaymentId)
                .HasConstraintName("FK_CustomerPaymentLines_PaymentId");
        });

        modelBuilder.Entity<DebitMemo>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DebitMem__3214EC0703131B16");

            entity.ToTable("DebitMemo");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.AmountDue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.AmountPaid).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GrossAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.NetTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SequenceNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TranDate).HasColumnType("date");

            entity.HasOne(d => d.Customer).WithMany(p => p.DebitMemos)
                .HasForeignKey(d => d.CustomerID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DebitMemo_Customer");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.DebitMemos)
                .HasForeignKey(d => d.Form)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DebitMemo_Form");

            entity.HasOne(d => d.Location).WithMany(p => p.DebitMemos)
                .HasForeignKey(d => d.LocationID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DebitMemo_Location");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.DebitMemos)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_DebitMemo_Status");
        });

        modelBuilder.Entity<DebitMemoLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DebitMem__3214EC07BD81DD68");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxPercent).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.DebitMemo).WithMany(p => p.DebitMemoLines)
                .HasForeignKey(d => d.DebitMemoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DebitMemoLines_DMID");

            entity.HasOne(d => d.Item).WithMany(p => p.DebitMemoLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DebitMemoLines_Item");

            entity.HasOne(d => d.Tax).WithMany(p => p.DebitMemoLines)
                .HasForeignKey(d => d.TaxID)
                .HasConstraintName("FK_DebitMemoLines_TaxID");
        });

        modelBuilder.Entity<Form>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Forms__3214EC07E9F76E9E");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.FormName).HasMaxLength(255);
            entity.Property(e => e.Inactive).HasDefaultValue(false);
            entity.Property(e => e.IsDefault).HasDefaultValue(false);
            entity.Property(e => e.Prefix).HasMaxLength(50);

            entity.HasOne(d => d.AccountPayableNavigation).WithMany(p => p.FormAccountPayableNavigations)
                .HasForeignKey(d => d.AccountPayable)
                .HasConstraintName("FK_Forms_AccountPayable");

            entity.HasOne(d => d.AccountReceivableNavigation).WithMany(p => p.FormAccountReceivableNavigations)
                .HasForeignKey(d => d.AccountReceivable)
                .HasConstraintName("FK_Forms_AccountReceivable");

            entity.HasOne(d => d.AccuredARNavigation).WithMany(p => p.FormAccuredARNavigations)
                .HasForeignKey(d => d.AccuredAR)
                .HasConstraintName("FK_Forms_AccuredAR");

            entity.HasOne(d => d.AccuredTaxNavigation).WithMany(p => p.FormAccuredTaxNavigations)
                .HasForeignKey(d => d.AccuredTax)
                .HasConstraintName("FK_Forms_AccuredTax");

            entity.HasOne(d => d.ClearingNavigation).WithMany(p => p.FormClearingNavigations)
                .HasForeignKey(d => d.Clearing)
                .HasConstraintName("FK_Forms_Clearing");

            entity.HasOne(d => d.ClearingGRNINavigation).WithMany(p => p.FormClearingGRNINavigations)
                .HasForeignKey(d => d.ClearingGRNI)
                .HasConstraintName("FK_Forms_ClearingGRNI");

            entity.HasOne(d => d.ClearingSRNINavigation).WithMany(p => p.FormClearingSRNINavigations)
                .HasForeignKey(d => d.ClearingSRNI)
                .HasConstraintName("FK_Forms_ClearingSRNI");

            entity.HasOne(d => d.ClearingVATNavigation).WithMany(p => p.FormClearingVATNavigations)
                .HasForeignKey(d => d.ClearingVAT)
                .HasConstraintName("FK_Forms_ClearingVAT");

            entity.HasOne(d => d.DiscountOnTaxNavigation).WithMany(p => p.FormDiscountOnTaxNavigations)
                .HasForeignKey(d => d.DiscountOnTax)
                .HasConstraintName("FK_Forms_DiscountOnTax");

            entity.HasOne(d => d.DiscountOnTaxCRNavigation).WithMany(p => p.FormDiscountOnTaxCRNavigations)
                .HasForeignKey(d => d.DiscountOnTaxCR)
                .HasConstraintName("FK_Forms_ChartOfAccounts_DiscountCR");

            entity.HasOne(d => d.DiscountOnTaxDRNavigation).WithMany(p => p.FormDiscountOnTaxDRNavigations)
                .HasForeignKey(d => d.DiscountOnTaxDR)
                .HasConstraintName("FK_Forms_ChartOfAccounts_DiscountDR");

            entity.HasOne(d => d.FormTypeNavigation).WithMany(p => p.Forms)
                .HasForeignKey(d => d.FormType)
                .HasConstraintName("FK_Forms_FormType");

            entity.HasOne(d => d.TypeOfRecordNavigation).WithMany(p => p.Forms)
                .HasForeignKey(d => d.TypeOfRecord)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Forms_TypeOfRecord");

            entity.HasOne(d => d.UndepositedFundsNavigation).WithMany(p => p.FormUndepositedFundsNavigations)
                .HasForeignKey(d => d.UndepositedFunds)
                .HasConstraintName("FK_Forms_UndepositedFunds");
        });

        modelBuilder.Entity<FormSequence>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__FormSequ__3214EC0760B39E1C");

            entity.ToTable("FormSequence");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

            entity.HasOne(d => d.Form).WithMany(p => p.FormSequences)
                .HasForeignKey(d => d.FormId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FormSequence_Forms");
        });

        modelBuilder.Entity<FormSourceType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__FormSour__3214EC270068149F");

            entity.ToTable("FormSourceType");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<InventoryAdjustment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Inventor__3214EC078AE249D9");

            entity.ToTable("InventoryAdjustment");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.SequenceNumber).HasMaxLength(50);
            entity.Property(e => e.TranDate).HasColumnType("date");

            entity.HasOne(d => d.CustomerNavigation).WithMany(p => p.InventoryAdjustments)
                .HasForeignKey(d => d.Customer)
                .HasConstraintName("FK_InventoryAdjustment_Customer");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.InventoryAdjustments)
                .HasForeignKey(d => d.Form)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InventoryAdjustment_Form");

            entity.HasOne(d => d.LocationNavigation).WithMany(p => p.InventoryAdjustments)
                .HasForeignKey(d => d.Location)
                .HasConstraintName("FK_InventoryAdjustment_Location");
        });

        modelBuilder.Entity<InventoryAdjustmentLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Inventor__3214EC07958225FC");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.QuantityAdjusted).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.QuantityInHand).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Reason).HasMaxLength(50);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.InventoryAdjustment).WithMany(p => p.InventoryAdjustmentLines)
                .HasForeignKey(d => d.InventoryAdjustmentID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InventoryAdjustmentLines_InventoryAdjustmentID");

            entity.HasOne(d => d.Item).WithMany(p => p.InventoryAdjustmentLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InventoryAdjustmentLines_Item");
        });

        modelBuilder.Entity<InventoryDetail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Inventor__3214EC073C808D64");

            entity.ToTable("InventoryDetail");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.QuantityAvailable).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Item).WithMany(p => p.InventoryDetails)
                .HasForeignKey(d => d.ItemId)
                .HasConstraintName("FK_InventoryDetail_Products");

            entity.HasOne(d => d.Location).WithMany(p => p.InventoryDetails)
                .HasForeignKey(d => d.LocationId)
                .HasConstraintName("FK_InventoryDetail_Locations");
        });

        modelBuilder.Entity<InventoryLedger>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Inventor__3214EC071EBDB793");

            entity.ToTable("InventoryLedger");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Date).HasColumnType("date");
            entity.Property(e => e.QuantityChange).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ReferenceId).HasMaxLength(100);
            entity.Property(e => e.TransactionType).HasMaxLength(50);

            entity.HasOne(d => d.Item).WithMany(p => p.InventoryLedgers)
                .HasForeignKey(d => d.ItemID)
                .HasConstraintName("FK_InventoryLedger_Item");

            entity.HasOne(d => d.Location).WithMany(p => p.InventoryLedgers)
                .HasForeignKey(d => d.LocationID)
                .HasConstraintName("FK_InventoryLedger_Location");
        });

        modelBuilder.Entity<InventoryTransfer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Inventor__3214EC07A503BA62");

            entity.ToTable("InventoryTransfer");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.SequenceNumber).HasMaxLength(50);
            entity.Property(e => e.TranDate).HasColumnType("date");

            entity.HasOne(d => d.Customer).WithMany(p => p.InventoryTransfers)
                .HasForeignKey(d => d.CustomerID)
                .HasConstraintName("FK_InventoryTransfer_Customer");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.InventoryTransfers)
                .HasForeignKey(d => d.Form)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InventoryTransfer_Form");

            entity.HasOne(d => d.FromLocationNavigation).WithMany(p => p.InventoryTransferFromLocationNavigations)
                .HasForeignKey(d => d.FromLocation)
                .HasConstraintName("FK_InventoryTransfer_FromLocation");

            entity.HasOne(d => d.ToLocationNavigation).WithMany(p => p.InventoryTransferToLocationNavigations)
                .HasForeignKey(d => d.ToLocation)
                .HasConstraintName("FK_InventoryTransfer_ToLocation");
        });

        modelBuilder.Entity<InventoryTransferLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Inventor__3214EC07389E174E");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.QuantityInHand).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.QuantityTransfer).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Reason).HasMaxLength(50);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.InventoryTransfer).WithMany(p => p.InventoryTransferLines)
                .HasForeignKey(d => d.InventoryTransferID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InventoryTransferLines_InventoryTransferID");

            entity.HasOne(d => d.Item).WithMany(p => p.InventoryTransferLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InventoryTransferLines_Item");
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Invoice__3214EC0746609DD6");

            entity.ToTable("Invoice");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AmountDue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.AmountPaid).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Discount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GrossAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.InvoiceDate).HasColumnType("date");
            entity.Property(e => e.NetTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SequenceNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Customer).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.CustomerID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Invoice_Customer");

            entity.HasOne(d => d.DN).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.DNID)
                .HasConstraintName("FK_Invoice_Itemfulfilment");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.Form)
                .HasConstraintName("FK_Invoice_Form");

            entity.HasOne(d => d.Location).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.LocationID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Invoice_Location");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_Invoice_Status");
        });

        modelBuilder.Entity<InvoiceFulFillMentLink>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__InvoiceF__3214EC077102E509");

            entity.HasIndex(e => new { e.InvoiceID, e.ItemFulFillmentID }, "UQ_InvoiceFulFillMent_ItemFulFillMent").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();

            entity.HasOne(d => d.Invoice).WithMany(p => p.InvoiceFulFillMentLinks)
                .HasForeignKey(d => d.InvoiceID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InvoiceFulFillMentLinks_Invoice");

            entity.HasOne(d => d.ItemFulFillment).WithMany(p => p.InvoiceFulFillMentLinks)
                .HasForeignKey(d => d.ItemFulFillmentID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InvoiceFulFillMentLinks_ItemFulFillMent");
        });

        modelBuilder.Entity<InvoiceLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__InvoiceL__4383E576B5D85946");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.QuantityDelivered).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.TaxPercent).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxRate).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.IN).WithMany(p => p.InvoiceLines)
                .HasForeignKey(d => d.INID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InvoiceLines_INID");

            entity.HasOne(d => d.ItemFulfillmentLine).WithMany(p => p.InvoiceLines)
                .HasForeignKey(d => d.ItemFulfillmentLineId)
                .HasConstraintName("FK_InvoiceLines_ItemfulfilmentLines");

            entity.HasOne(d => d.Item).WithMany(p => p.InvoiceLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InvoiceLines_Item");

            entity.HasOne(d => d.Tax).WithMany(p => p.InvoiceLines)
                .HasForeignKey(d => d.TaxID)
                .HasConstraintName("FK_InvoiceLines_TaxMaster");
        });

        modelBuilder.Entity<ItemFulfilment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ItemFulf__24BECAC708E59282");

            entity.ToTable("ItemFulfilment");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.DeliveryDate).HasColumnType("date");
            entity.Property(e => e.Discount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GrossAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.NetTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SequenceNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Customer).WithMany(p => p.ItemFulfilments)
                .HasForeignKey(d => d.CustomerID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ItemFulfilment_Customer");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.ItemFulfilments)
                .HasForeignKey(d => d.Form)
                .HasConstraintName("FK_ItemFulfilment_Form");

            entity.HasOne(d => d.Location).WithMany(p => p.ItemFulfilments)
                .HasForeignKey(d => d.LocationID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ItemFulfilment_Location");

            entity.HasOne(d => d.SO).WithMany(p => p.ItemFulfilments)
                .HasForeignKey(d => d.SOID)
                .HasConstraintName("FK_ItemFulfilment_SalesOrder");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.ItemFulfilments)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_ItemFulfilment_Status");
        });

        modelBuilder.Entity<ItemFulfilmentLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ItemFulf__3214EC0702354C53");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxPercent).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.DN).WithMany(p => p.ItemFulfilmentLines)
                .HasForeignKey(d => d.DNID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ItemFulfilmentLines_DeliveryNote");

            entity.HasOne(d => d.Item).WithMany(p => p.ItemFulfilmentLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ItemFulfilmentLines_Items");

            entity.HasOne(d => d.SalesOrderLine).WithMany(p => p.ItemFulfilmentLines)
                .HasForeignKey(d => d.SalesOrderLineId)
                .HasConstraintName("FK_SalesOrder_Itemfulfilmentlines");

            entity.HasOne(d => d.Tax).WithMany(p => p.ItemFulfilmentLines)
                .HasForeignKey(d => d.TaxID)
                .HasConstraintName("FK_ItemFulfilmentLines_TaxMaster");
        });

        modelBuilder.Entity<ItemReceipt>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ItemRece__3214EC071298AB5D");

            entity.ToTable("ItemReceipt");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Discount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GrossAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.NetTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ReceiptDate).HasColumnType("date");
            entity.Property(e => e.SequenceNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.ItemReceipts)
                .HasForeignKey(d => d.Form)
                .HasConstraintName("FK_ItemReceipt_Form");

            entity.HasOne(d => d.Location).WithMany(p => p.ItemReceipts)
                .HasForeignKey(d => d.LocationID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ItemReceipt_Location");

            entity.HasOne(d => d.PO).WithMany(p => p.ItemReceipts)
                .HasForeignKey(d => d.POID)
                .HasConstraintName("FK_ItemReceipt_PurchaseOrder");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.ItemReceipts)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_Status_ItemReceipt");

            entity.HasOne(d => d.Vendor).WithMany(p => p.ItemReceipts)
                .HasForeignKey(d => d.VendorID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ItemReceipt_Vendor");
        });

        modelBuilder.Entity<ItemReceiptLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ItemRece__3214EC079B9C630C");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxPercent).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.IR).WithMany(p => p.ItemReceiptLines)
                .HasForeignKey(d => d.IRID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ItemReceiptLines_IRHeader");

            entity.HasOne(d => d.Item).WithMany(p => p.ItemReceiptLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ItemReceiptLines_Item");

            entity.HasOne(d => d.PurchaseOrderLine).WithMany(p => p.ItemReceiptLines)
                .HasForeignKey(d => d.PurchaseOrderLineId)
                .HasConstraintName("FK_ItemReceiptLines_purchaseOrderLines");

            entity.HasOne(d => d.Tax).WithMany(p => p.ItemReceiptLines)
                .HasForeignKey(d => d.TaxID)
                .HasConstraintName("FK_ItemReceiptLines_Tax");
        });

        modelBuilder.Entity<ItemType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ItemType__3214EC074331D9AC");

            entity.ToTable("ItemType");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<JournalEntry>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__JournalE__3214EC07BCE4013A");

            entity.ToTable("JournalEntry");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.JournalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Memo).HasMaxLength(50);
            entity.Property(e => e.RecordID).HasMaxLength(200);
            entity.Property(e => e.RecordType).HasMaxLength(50);
            entity.Property(e => e.SequenceNumber).HasMaxLength(50);
            entity.Property(e => e.TranDate).HasColumnType("date");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.JournalEntries)
                .HasForeignKey(d => d.Form)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_JournalEntryLines_Forms");
        });

        modelBuilder.Entity<JournalEntryLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__JournalE__3214EC078290056A");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Credit).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Debit).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Memo).HasMaxLength(50);
            entity.Property(e => e.RecordID).HasMaxLength(200);
            entity.Property(e => e.RecordType).HasMaxLength(50);

            entity.HasOne(d => d.AccountNavigation).WithMany(p => p.JournalEntryLines)
                .HasForeignKey(d => d.Account)
                .HasConstraintName("FK_JournalEntryLines_ChartOfAccounts");

            entity.HasOne(d => d.JE).WithMany(p => p.JournalEntryLines)
                .HasForeignKey(d => d.JEID)
                .HasConstraintName("FK_JournalEntryLines_JournalEntry");
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Location__3214EC070E03B13F");

            entity.ToTable("Location");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Address).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Notes).HasMaxLength(50);
            entity.Property(e => e.Phone).HasMaxLength(50);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Items__3214EC072ACC5D33");

            entity.ToTable("Product");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AverageCost).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ItemCode).HasMaxLength(50);
            entity.Property(e => e.ItemName).HasMaxLength(100);
            entity.Property(e => e.PurchasePrice).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.SalesPrice).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.SequenceNumber).HasMaxLength(50);
            entity.Property(e => e.StandardCost).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.COGSAccountNavigation).WithMany(p => p.ProductCOGSAccountNavigations)
                .HasForeignKey(d => d.COGSAccount)
                .HasConstraintName("FK_Items_COGSAccount");

            entity.HasOne(d => d.ExpenseAccountNavigation).WithMany(p => p.ProductExpenseAccountNavigations)
                .HasForeignKey(d => d.ExpenseAccount)
                .HasConstraintName("FK_Items_PurchaseAccount");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.Products)
                .HasForeignKey(d => d.Form)
                .HasConstraintName("FK_Product_Forms");

            entity.HasOne(d => d.InventoryAccountNavigation).WithMany(p => p.ProductInventoryAccountNavigations)
                .HasForeignKey(d => d.InventoryAccount)
                .HasConstraintName("FK_Items_InventoryAccount");

            entity.HasOne(d => d.ItemTypeNavigation).WithMany(p => p.Products)
                .HasForeignKey(d => d.ItemType)
                .HasConstraintName("FK_Product_Type");

            entity.HasOne(d => d.PurchaseTaxCodeNavigation).WithMany(p => p.ProductPurchaseTaxCodeNavigations).HasForeignKey(d => d.PurchaseTaxCode);

            entity.HasOne(d => d.SalesAccountNavigation).WithMany(p => p.ProductSalesAccountNavigations)
                .HasForeignKey(d => d.SalesAccount)
                .HasConstraintName("FK_Items_SalesAccount");

            entity.HasOne(d => d.SalesTaxCodeNavigation).WithMany(p => p.ProductSalesTaxCodeNavigations).HasForeignKey(d => d.SalesTaxCode);
        });

        modelBuilder.Entity<ProductStock>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ProductS__3214EC0794918D22");

            entity.ToTable("ProductStock");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.OpeningStockQty).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OpeningStockRate).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Item).WithMany(p => p.ProductStocks)
                .HasForeignKey(d => d.ItemID)
                .HasConstraintName("FK_Stock_Item");

            entity.HasOne(d => d.Location).WithMany(p => p.ProductStocks)
                .HasForeignKey(d => d.LocationID)
                .HasConstraintName("FK_Stock_Location");
        });

        modelBuilder.Entity<PurchaseOrder>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Purchase__3214EC07A702854A");

            entity.ToTable("PurchaseOrder");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Discount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GrossAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.NetTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PODate).HasColumnType("date");
            entity.Property(e => e.SequenceNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.PurchaseOrders)
                .HasForeignKey(d => d.Form)
                .HasConstraintName("FK_PurchaseOrder_Form");

            entity.HasOne(d => d.Location).WithMany(p => p.PurchaseOrders)
                .HasForeignKey(d => d.LocationID)
                .HasConstraintName("FK_PurchaseOrder_Location");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.PurchaseOrders)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_Status_PurchaseOrder");

            entity.HasOne(d => d.Vendor).WithMany(p => p.PurchaseOrders)
                .HasForeignKey(d => d.VendorID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PurchaseOrder_Vendor");
        });

        modelBuilder.Entity<PurchaseOrderLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Purchase__3214EC0716F8A783");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxPercent).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Item).WithMany(p => p.PurchaseOrderLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PurchaseOrderLines_Item");

            entity.HasOne(d => d.PO).WithMany(p => p.PurchaseOrderLines)
                .HasForeignKey(d => d.POID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PurchaseOrderLines_PurchaseOrder");

            entity.HasOne(d => d.Tax).WithMany(p => p.PurchaseOrderLines)
                .HasForeignKey(d => d.TaxID)
                .HasConstraintName("FK_PurchaseOrderLines_TaxMaster");
        });

        modelBuilder.Entity<RecordType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__RecordTy__3214EC073FB9C9E2");

            entity.ToTable("RecordType");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<SalesOrder>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SalesOrd__3214EC07CC5C8178");

            entity.ToTable("SalesOrder");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Discount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GrossAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.NetTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SODate).HasColumnType("date");
            entity.Property(e => e.SequenceNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Customer).WithMany(p => p.SalesOrders)
                .HasForeignKey(d => d.CustomerID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SalesOrders_Customers");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.SalesOrders)
                .HasForeignKey(d => d.Form)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SalesOrder_Form");

            entity.HasOne(d => d.Location).WithMany(p => p.SalesOrders)
                .HasForeignKey(d => d.LocationID)
                .HasConstraintName("FK_SO_Location");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.SalesOrders)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_SalesOrder_Status");
        });

        modelBuilder.Entity<SalesOrderLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SalesOrd__3214EC07562BBD6E");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Item).WithMany(p => p.SalesOrderLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SOL_Products");

            entity.HasOne(d => d.SO).WithMany(p => p.SalesOrderLines)
                .HasForeignKey(d => d.SOID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SOL_SalesOrders");

            entity.HasOne(d => d.Tax).WithMany(p => p.SalesOrderLines)
                .HasForeignKey(d => d.TaxID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SOL_TaxMaster");
        });

        modelBuilder.Entity<SalesOrderNumberSequence>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SalesOrd__3214EC07B57120BE");

            entity.ToTable("SalesOrderNumberSequence");

            entity.Property(e => e.Id).ValueGeneratedNever();
        });

        modelBuilder.Entity<StandardField>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Standard__3214EC07F0E4B51D");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Label).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Source).HasMaxLength(100);

            entity.HasOne(d => d.FieldTypeNavigation).WithMany(p => p.StandardFields)
                .HasForeignKey(d => d.FieldType)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StandardFields_TypeOfField");

            entity.HasOne(d => d.TypeOfRecordNavigation).WithMany(p => p.StandardFields)
                .HasForeignKey(d => d.TypeOfRecord)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StandardFields_RecordType");
        });

        modelBuilder.Entity<Status>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Status__3214EC27321D20E5");

            entity.ToTable("Status");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Tax>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Taxes__3214EC07DFDCD93F");

            entity.ToTable("Tax");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Inactive).HasDefaultValue(false);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.TaxRate).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.TaxAccountNavigation).WithMany(p => p.Taxes)
                .HasForeignKey(d => d.TaxAccount)
                .HasConstraintName("FK_Tax_TaxAccount");
        });

        modelBuilder.Entity<TransactionStatus>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Transact__3214EC0709DB4D74");

            entity.ToTable("TransactionStatus");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Name).HasMaxLength(100);

            entity.HasOne(d => d.TypeOfRecordNavigation).WithMany(p => p.TransactionStatuses)
                .HasForeignKey(d => d.TypeOfRecord)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TransactionStatus_RecordType");
        });

        modelBuilder.Entity<TypeOfField>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TypeOfFi__3214EC07E5CCEC54");

            entity.ToTable("TypeOfField");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.ComponentName).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.PackageName).HasMaxLength(100);
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Vendor__3214EC071724E431");

            entity.ToTable("Vendor");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Address).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.SequenceNumber).HasMaxLength(50);

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.Vendors)
                .HasForeignKey(d => d.Form)
                .HasConstraintName("FK_Vendor_Form");
        });

        modelBuilder.Entity<VendorBill>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VendorBi__3214EC079F8FE160");

            entity.ToTable("VendorBill");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.AmountDue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.AmountPaid).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Discount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GrossAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.InvoiceDate).HasColumnType("date");
            entity.Property(e => e.NetTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SequenceNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.VendorBills)
                .HasForeignKey(d => d.Form)
                .HasConstraintName("FK_VendorBill_Form");

            entity.HasOne(d => d.IR).WithMany(p => p.VendorBills)
                .HasForeignKey(d => d.IRID)
                .HasConstraintName("FK_VendorBill_ItemReceipt");

            entity.HasOne(d => d.Location).WithMany(p => p.VendorBills)
                .HasForeignKey(d => d.LocationID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorBill_Location");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.VendorBills)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_VendorBill_Status");

            entity.HasOne(d => d.Vendor).WithMany(p => p.VendorBills)
                .HasForeignKey(d => d.VendorID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorBill_Vendor");
        });

        modelBuilder.Entity<VendorBillLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VendorBi__3214EC07F3572BFA");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxPercent).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Item).WithMany(p => p.VendorBillLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorBillLines_Item");

            entity.HasOne(d => d.ItemReceiptLine).WithMany(p => p.VendorBillLines)
                .HasForeignKey(d => d.ItemReceiptLineId)
                .HasConstraintName("FK_VendorBillLines_ItemReceiptLines");

            entity.HasOne(d => d.Tax).WithMany(p => p.VendorBillLines)
                .HasForeignKey(d => d.TaxID)
                .HasConstraintName("FK_VendorBillLines_Tax");

            entity.HasOne(d => d.VB).WithMany(p => p.VendorBillLines)
                .HasForeignKey(d => d.VBID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorBillLines_VendorBillHeader");
        });

        modelBuilder.Entity<VendorCredit>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VendorCr__3214EC076B8A04D6");

            entity.ToTable("VendorCredit");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Applied).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GrossAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.NetTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SequenceNumber).HasMaxLength(50);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TranDate).HasColumnType("date");
            entity.Property(e => e.UnApplied).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.VendorCredits)
                .HasForeignKey(d => d.Form)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorCredit_Form");

            entity.HasOne(d => d.Location).WithMany(p => p.VendorCredits)
                .HasForeignKey(d => d.LocationID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorCredit_Location");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.VendorCredits)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_VendorCredit_Status");

            entity.HasOne(d => d.Vendor).WithMany(p => p.VendorCredits)
                .HasForeignKey(d => d.VendorID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorCredit_Vendor");
        });

        modelBuilder.Entity<VendorCreditLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VendorCr__3214EC070A9CFB04");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxPercent).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Item).WithMany(p => p.VendorCreditLines)
                .HasForeignKey(d => d.ItemID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorCreditLines_Items");

            entity.HasOne(d => d.Tax).WithMany(p => p.VendorCreditLines)
                .HasForeignKey(d => d.TaxId)
                .HasConstraintName("FK_VendorCreditLines_Taxes");

            entity.HasOne(d => d.VC).WithMany(p => p.VendorCreditLines)
                .HasForeignKey(d => d.VCID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorCreditLines_VendorCredits");
        });

        modelBuilder.Entity<VendorCreditPaymentLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VendorCr__3214EC0728CE2483");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.MainRecordAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.RecordID).HasMaxLength(50);
            entity.Property(e => e.RecordType).HasMaxLength(50);
            entity.Property(e => e.RefNo).HasMaxLength(50);
            entity.Property(e => e.VendorCreditSeqNum).HasMaxLength(50);

            entity.HasOne(d => d.VC).WithMany(p => p.VendorCreditPaymentLines)
                .HasForeignKey(d => d.VCID)
                .HasConstraintName("FK_VendorCreditPaymentLines_VendorCredit");
        });

        modelBuilder.Entity<VendorPayment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VendorPa__3214EC077E02C13E");

            entity.ToTable("VendorPayment");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.AppliedAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentDate).HasColumnType("date");
            entity.Property(e => e.SequenceNumber).HasMaxLength(50);
            entity.Property(e => e.UnAppliedAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.FormNavigation).WithMany(p => p.VendorPayments)
                .HasForeignKey(d => d.Form)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorPayment_Form");

            entity.HasOne(d => d.LocationNavigation).WithMany(p => p.VendorPayments)
                .HasForeignKey(d => d.Location)
                .HasConstraintName("FK_VendorPayment_Location");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.VendorPayments)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("FK_VendorPayment_Status");

            entity.HasOne(d => d.VendorNavigation).WithMany(p => p.VendorPayments)
                .HasForeignKey(d => d.Vendor)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VendorPayment_Vendor");
        });

        modelBuilder.Entity<VendorPaymentLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VendorPa__3214EC072C61A056");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.IsApplied).HasDefaultValue(false);
            entity.Property(e => e.MainRecordAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentSeqNum).HasMaxLength(50);
            entity.Property(e => e.RecordID).HasMaxLength(50);
            entity.Property(e => e.RecordType).HasMaxLength(50);
            entity.Property(e => e.RefNo).HasMaxLength(50);

            entity.HasOne(d => d.Payment).WithMany(p => p.VendorPaymentLines)
                .HasForeignKey(d => d.PaymentId)
                .HasConstraintName("FK_VendorPaymentLines_PaymentId");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
