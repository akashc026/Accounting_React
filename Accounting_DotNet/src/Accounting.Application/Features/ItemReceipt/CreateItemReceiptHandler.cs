using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateItemReceiptHandler : CreateEntityHandler<AccountingDbContext, ItemReceipt, Guid, CreateItemReceipt, Guid>
    {
        public CreateItemReceiptHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateItemReceipt, ItemReceipt> args)
        {
            return args.Entity.Id;
        }
    }
} 
