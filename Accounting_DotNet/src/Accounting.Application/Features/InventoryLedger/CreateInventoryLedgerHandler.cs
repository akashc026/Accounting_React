using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateInventoryLedgerHandler : CreateEntityHandler<AccountingDbContext, InventoryLedger, Guid, CreateInventoryLedger, Guid>
    {
        public CreateInventoryLedgerHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateInventoryLedger, InventoryLedger> args)
        {
            return args.Entity.Id;
        }
    }
} 