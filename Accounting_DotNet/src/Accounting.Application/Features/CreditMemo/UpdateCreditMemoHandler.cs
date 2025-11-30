using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateCreditMemoHandler : UpdateEntityHandler<AccountingDbContext, CreditMemo, Guid, UpdateCreditMemo, Guid>
    {
        public UpdateCreditMemoHandler(AccountingDbContext dbContext, IMapper mapper)
            : base(dbContext, mapper)
        {
        }

        protected override CreditMemo UpdateEntity(UpdateCreditMemo request, CreditMemo entity, IMapper mapper)
        {
            if (request.Form.HasValue)
                entity.Form = request.Form.Value;

            if (request.CustomerID.HasValue)
                entity.CustomerID = request.CustomerID.Value;

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
