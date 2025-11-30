using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;

namespace Accounting.Application.Features
{
    public class UpdateVendorCreditHandler : UpdateEntityHandler<AccountingDbContext, VendorCredit, Guid, UpdateVendorCredit, Guid>
    {
        public UpdateVendorCreditHandler(AccountingDbContext dbContext, IMapper mapper)
            : base(dbContext, mapper)
        {
        }

        protected override VendorCredit UpdateEntity(UpdateVendorCredit request, VendorCredit entity, IMapper mapper)
        {

            if (request.Form.HasValue)
                entity.Form = request.Form.Value;

            if (request.VendorID.HasValue)
                entity.VendorID = request.VendorID.Value;

            if (request.LocationID.HasValue)
                entity.LocationID = request.LocationID.Value;

            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount.Value;

            if (request.Applied.HasValue)
                entity.Applied = request.Applied.Value;

            if (request.UnApplied.HasValue)
                entity.UnApplied = request.UnApplied.Value;
            
            if (request.SequenceNumber != null)
                entity.SequenceNumber = request.SequenceNumber;

            if (request.TranDate.HasValue)
                entity.TranDate = request.TranDate.Value;

            if (request.Status.HasValue)
                entity.Status = request.Status.Value;

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
