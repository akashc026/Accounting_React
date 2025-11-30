using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateSalesOrderHandler : UpdateEntityHandler<AccountingDbContext, SalesOrder, Guid, UpdateSalesOrder, Guid>
    {
        public UpdateSalesOrderHandler(AccountingDbContext dbContext, IMapper mapper)
            : base(dbContext, mapper)
        {
        }

        protected override SalesOrder UpdateEntity(UpdateSalesOrder request, SalesOrder entity, IMapper mapper)
        {
            if (request.CustomerID.HasValue)
                entity.CustomerID = request.CustomerID.Value;

            if (request.SODate.HasValue)
                entity.SODate = request.SODate.Value;

            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount.Value;

            if (request.LocationID.HasValue)
                entity.LocationID = request.LocationID.Value;

            if (request.Form.HasValue)
                entity.Form = request.Form.Value;

            if (request.SequenceNumber != null)
                entity.SequenceNumber = request.SequenceNumber;

            if (request.Status.HasValue)
                entity.Status = request.Status.Value;

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
