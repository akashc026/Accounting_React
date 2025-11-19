using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateVendorBillLineHandler : UpdateEntityHandler<AccountingDbContext, VendorBillLine, Guid, UpdateVendorBillLine, Guid>
    {
        public UpdateVendorBillLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override VendorBillLine UpdateEntity(UpdateVendorBillLine request, VendorBillLine entity, IMapper mapper)
        {
            // Only update fields that are provided (non-default values)
            if (request.VBID != Guid.Empty)
                entity.VBID = request.VBID;

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

            if (request.IsActive.HasValue)
                entity.IsActive = request.IsActive;

            if (request.ItemReceiptLineId.HasValue)
                entity.ItemReceiptLineId = request.ItemReceiptLineId;

            return entity;
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateVendorBillLine, VendorBillLine> args)
        {
            return args.Entity.Id;
        }
    }
} 
