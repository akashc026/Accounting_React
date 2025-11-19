using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateInvoiceLineHandler : CreateEntityHandler<AccountingDbContext, InvoiceLine, Guid, CreateInvoiceLine, Guid>
    {
        public CreateInvoiceLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateInvoiceLine, InvoiceLine> args)
        {
            return args.Entity.Id;
        }
    }
} 