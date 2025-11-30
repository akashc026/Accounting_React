using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;

namespace Accounting.Application.Features
{
    public class UpdateItemReceiptHandler : UpdateEntityHandler<AccountingDbContext, ItemReceipt, Guid, UpdateItemReceipt, Guid>
    {
        public UpdateItemReceiptHandler(AccountingDbContext dbContext, IMapper mapper)
            : base(dbContext, mapper)
        {
        }

        protected override ItemReceipt UpdateEntity(UpdateItemReceipt request, ItemReceipt entity, IMapper mapper)
        {

            if (request.VendorID.HasValue)
                entity.VendorID = request.VendorID.Value;

            if (request.POID.HasValue)
                entity.POID = request.POID.Value;

            if (request.ReceiptDate.HasValue)
                entity.ReceiptDate = request.ReceiptDate.Value;

            if (request.Status.HasValue)
                entity.Status = request.Status.Value;

            if (request.LocationID.HasValue)
                entity.LocationID = request.LocationID.Value;

            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount.Value;

            if (request.Form.HasValue)
                entity.Form = request.Form.Value;
            
            if (request.SequenceNumber != null)
                entity.SequenceNumber = request.SequenceNumber;

            if (request.Inactive.HasValue)
                entity.Inactive = request.Inactive.Value;

            if (request.Discount.HasValue)
                entity.Discount = request.Discount.Value;

            if (request.GrossAmount.HasValue)
                entity.GrossAmount = request.GrossAmount.Value;

            if (request.TaxTotal.HasValue)
                entity.TaxTotal = request.TaxTotal.Value;

            if (request.SubTotal.HasValue)
                entity.SubTotal = request.SubTotal.Value;

            if (request.NetTotal.HasValue)
                entity.NetTotal = request.NetTotal.Value;

            return entity;
        }
    }
}
