using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdatePurchaseOrderLineHandler : UpdateEntityHandler<AccountingDbContext, PurchaseOrderLine, Guid, UpdatePurchaseOrderLine, Guid>
    {
        public UpdatePurchaseOrderLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override PurchaseOrderLine UpdateEntity(UpdatePurchaseOrderLine request, PurchaseOrderLine entity, IMapper mapper)
        {
            // Only update fields that are provided (non-default values)
            if (request.POID != Guid.Empty)
                entity.POID = request.POID;

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

            if (request.ReceivedQty.HasValue)
                entity.ReceivedQty = request.ReceivedQty;

            return entity;
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdatePurchaseOrderLine, PurchaseOrderLine> args)
        {
            return args.Entity.Id;
        }
    }
} 
