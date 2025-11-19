using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateItemReceiptLineHandler : CreateEntityHandler<AccountingDbContext, ItemReceiptLine, Guid, CreateItemReceiptLine, Guid>
    {
        public CreateItemReceiptLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateItemReceiptLine, ItemReceiptLine> args)
        {
            return args.Entity.Id;
        }
    }
} 
