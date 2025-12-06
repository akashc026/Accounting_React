using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateInvoiceHandler : UpdateEntityHandler<AccountingDbContext, Invoice, Guid, UpdateInvoice, Guid>
    {
        public UpdateInvoiceHandler(AccountingDbContext dbContext, IMapper mapper)
            : base(dbContext, mapper)
        {
        }

        protected override Invoice UpdateEntity(UpdateInvoice request, Invoice entity, IMapper mapper)
        {
            if (request.CustomerID.HasValue)
                entity.CustomerID = request.CustomerID.Value;

            if (request.LocationID.HasValue)
                entity.LocationID = request.LocationID.Value;

            if (request.InvoiceDate.HasValue)
                entity.InvoiceDate = request.InvoiceDate.Value;

            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount.Value;

            if (request.Status != null)
                entity.Status = request.Status;

            if (request.DNID != null)
                entity.DNID = request.DNID;

            if (request.Inactive.HasValue)
                entity.Inactive = request.Inactive.Value;

            if (request.Discount.HasValue)
                entity.Discount = request.Discount.Value;

            if (request.Form.HasValue)
                entity.Form = request.Form.Value;
            
            if (request.SequenceNumber != null)
                entity.SequenceNumber = request.SequenceNumber;

            if (request.AmountDue.HasValue)
                entity.AmountDue = request.AmountDue.Value;

            if (request.AmountPaid.HasValue)
                entity.AmountPaid = request.AmountPaid.Value;

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

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateInvoice, Invoice> args)
        {
            return args.Entity.Id;
        }
    }
}
