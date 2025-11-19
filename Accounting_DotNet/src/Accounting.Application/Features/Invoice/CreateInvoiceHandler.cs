using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateInvoiceHandler : CreateEntityHandler<AccountingDbContext, Invoice, Guid, CreateInvoice, Guid>
    {
        public CreateInvoiceHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateInvoice, Invoice> args)
        {
            return args.Entity.Id;
        }
    }
} 