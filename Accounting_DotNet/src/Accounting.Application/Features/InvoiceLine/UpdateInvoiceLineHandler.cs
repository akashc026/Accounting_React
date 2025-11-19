using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateInvoiceLineHandler : UpdateEntityHandler<AccountingDbContext, InvoiceLine, Guid, UpdateInvoiceLine, Guid>
    {
        public UpdateInvoiceLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateInvoiceLine, InvoiceLine> args)
        {
            return args.Entity.Id;
        }
    }
} 