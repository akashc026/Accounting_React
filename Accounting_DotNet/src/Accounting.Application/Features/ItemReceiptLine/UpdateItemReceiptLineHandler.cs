using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateItemReceiptLineHandler : UpdateEntityHandler<AccountingDbContext, ItemReceiptLine, Guid, UpdateItemReceiptLine, Guid>
    {
        public UpdateItemReceiptLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override ItemReceiptLine UpdateEntity(UpdateItemReceiptLine request, ItemReceiptLine entity, IMapper mapper)
        {
            // Only update fields that are provided (non-default values)
            if (request.IRID != Guid.Empty)
                entity.IRID = request.IRID;

            if (request.ItemID != Guid.Empty)
                entity.ItemID = request.ItemID;

            if (request.Quantity != 0)
                entity.Quantity = request.Quantity;

            if (request.Rate.HasValue)
                entity.Rate = request.Rate;

            if (request.TaxID.HasValue)
                entity.TaxID = request.TaxID;

            if (request.TaxPercent.HasValue)
                entity.TaxPercent = request.TaxPercent;

            if (request.TaxAmount.HasValue)
                entity.TaxAmount = request.TaxAmount;

            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount;

            if (request.InvoicedQty.HasValue)
                entity.InvoicedQty = request.InvoicedQty;

            if (request.PurchaseOrderLineId.HasValue)
                entity.PurchaseOrderLineId = request.PurchaseOrderLineId;

            return entity;
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateItemReceiptLine, ItemReceiptLine> args)
        {
            return args.Entity.Id;
        }
    }
} 
