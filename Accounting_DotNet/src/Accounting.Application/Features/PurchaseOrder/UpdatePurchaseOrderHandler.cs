using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;

namespace Accounting.Application.Features
{
    public class UpdatePurchaseOrderHandler : UpdateEntityHandler<AccountingDbContext, PurchaseOrder, Guid, UpdatePurchaseOrder, Guid>
    {
        public UpdatePurchaseOrderHandler(AccountingDbContext dbContext, IMapper mapper)
            : base(dbContext, mapper)
        {
        }

        protected override PurchaseOrder UpdateEntity(UpdatePurchaseOrder request, PurchaseOrder entity, IMapper mapper)
        {

            if (request.VendorID.HasValue)
                entity.VendorID = request.VendorID.Value;

            if (request.PODate.HasValue)
                entity.PODate = request.PODate.Value;

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
