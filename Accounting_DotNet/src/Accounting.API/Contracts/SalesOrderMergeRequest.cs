using System;
using System.Collections.Generic;

namespace Accounting.API.Contracts
{
    public class SalesOrderMergeRequest
    {
        public SalesOrderMergeRecordDto Record { get; set; } = null!;

        public List<SalesOrderMergeLineDto>? Items { get; set; }

        public List<SalesOrderMergeCustomFieldDto>? CustomFields { get; set; }
    }

    public class SalesOrderMergeRecordDto
    {
        public Guid? Id { get; set; }

        public Guid? Form { get; set; }

        public Guid? CustomerID { get; set; }

        public Guid? LocationID { get; set; }

        public Guid? Status { get; set; }

        public DateTime? SODate { get; set; }

        public DateTime? InvoiceDate { get; set; }

        public string? SequenceNumber { get; set; }

        public bool? Inactive { get; set; }

        public decimal? Discount { get; set; }

        public decimal? GrossAmount { get; set; }

        public decimal? TaxTotal { get; set; }

        public decimal? SubTotal { get; set; }

        public decimal? NetTotal { get; set; }

        public decimal? TotalAmount { get; set; }

        public string? CreatedBy { get; set; }
    }

    public class SalesOrderMergeLineDto
    {
        public Guid? Id { get; set; }

        public Guid ItemID { get; set; }

        public decimal Quantity { get; set; }

        public decimal? Rate { get; set; }

        public Guid TaxID { get; set; }

        public decimal TaxPercent { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public int? FulFillQty { get; set; }

        public bool? IsDeleted { get; set; }
    }

    public class SalesOrderMergeCustomFieldDto
    {
        public Guid? Id { get; set; }

        public Guid CustomFieldID { get; set; }

        public Guid TypeOfRecord { get; set; }

        public string? ValueText { get; set; }
    }

    public class ItemFulfilmentMergeRequest
    {
        public ItemFulfilmentMergeRecordDto Record { get; set; } = null!;

        public List<ItemFulfilmentMergeLineDto>? Items { get; set; }

        public List<SalesOrderMergeCustomFieldDto>? CustomFields { get; set; }
    }

    public class ItemFulfilmentMergeRecordDto
    {
        public Guid? Id { get; set; }

        public Guid? SOID { get; set; }

        public Guid? CustomerID { get; set; }

        public Guid? LocationID { get; set; }

        public Guid? Form { get; set; }

        public DateTime? DeliveryDate { get; set; }

        public Guid? Status { get; set; }

        public bool? Inactive { get; set; }

        public decimal? Discount { get; set; }

        public decimal? InvoicedQty { get; set; }

        public decimal? TotalAmount { get; set; }

        public decimal? GrossAmount { get; set; }

        public decimal? TaxTotal { get; set; }

        public decimal? SubTotal { get; set; }

        public decimal? NetTotal { get; set; }

        public string? CreatedBy { get; set; }
    }

    public class ItemFulfilmentMergeLineDto
    {
        public Guid? Id { get; set; }

        public Guid ItemID { get; set; }

        public Guid? TaxID { get; set; }

        public decimal Quantity { get; set; }

        public decimal Rate { get; set; }

        public decimal TaxPercent { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public int? InvoicedQty { get; set; }

        public Guid? SalesOrderLineId { get; set; }

        public bool? IsDeleted { get; set; }
    }

    public class InvoiceMergeRequest
    {
        public InvoiceMergeRecordDto Record { get; set; } = null!;

        public List<InvoiceMergeLineDto>? Items { get; set; }

        public List<SalesOrderMergeCustomFieldDto>? CustomFields { get; set; }
    }

    public class InvoiceMergeRecordDto
    {
        public Guid? Id { get; set; }

        public Guid? CustomerID { get; set; }

        public Guid? LocationID { get; set; }

        public DateTime? InvoiceDate { get; set; }

        public Guid? Form { get; set; }

        public Guid? Status { get; set; }

        public Guid? DNID { get; set; }

        public bool? Inactive { get; set; }

        public decimal? Discount { get; set; }

        public decimal? AmountDue { get; set; }

        public decimal? AmountPaid { get; set; }

        public decimal? GrossAmount { get; set; }

        public decimal? TaxTotal { get; set; }

        public decimal? SubTotal { get; set; }

        public decimal? NetTotal { get; set; }

        public decimal? TotalAmount { get; set; }

        public string? CreatedBy { get; set; }
    }

    public class InvoiceMergeLineDto
    {
        public Guid? Id { get; set; }

        public Guid ItemID { get; set; }

        public decimal QuantityDelivered { get; set; }

        public decimal Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal TaxPercent { get; set; }

        public decimal TaxRate { get; set; }

        public decimal TotalAmount { get; set; }

        public Guid? ItemFulfillmentLineId { get; set; }

        public bool? IsDeleted { get; set; }
    }

    public class DebitMemoMergeRequest
    {
        public DebitMemoMergeRecordDto Record { get; set; } = null!;

        public List<DebitMemoMergeLineDto>? Items { get; set; }

        public List<SalesOrderMergeCustomFieldDto>? CustomFields { get; set; }
    }

    public class DebitMemoMergeRecordDto
    {
        public Guid? Id { get; set; }

        public Guid? CustomerID { get; set; }

        public Guid? LocationID { get; set; }

        public Guid? Form { get; set; }

        public DateTime? TranDate { get; set; }

        public decimal? TotalAmount { get; set; }

        public decimal? AmountDue { get; set; }

        public decimal? AmountPaid { get; set; }

        public decimal? GrossAmount { get; set; }

        public decimal? TaxTotal { get; set; }

        public decimal? SubTotal { get; set; }

        public decimal? NetTotal { get; set; }

        public Guid? Status { get; set; }

        public string? CreatedBy { get; set; }
    }

    public class DebitMemoMergeLineDto
    {
        public Guid? Id { get; set; }

        public Guid ItemID { get; set; }

        public decimal Quantity { get; set; }

        public decimal Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal? TaxPercent { get; set; }

        public decimal? TaxAmount { get; set; }

        public decimal? TotalAmount { get; set; }

        public bool? IsDeleted { get; set; }
    }
}
