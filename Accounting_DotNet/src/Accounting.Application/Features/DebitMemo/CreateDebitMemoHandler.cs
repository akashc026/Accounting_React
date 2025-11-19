using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateDebitMemoHandler : CreateEntityHandler<AccountingDbContext, DebitMemo, Guid, CreateDebitMemo, Guid>
    {
        public CreateDebitMemoHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateDebitMemo, DebitMemo> args)
        {
            return args.Entity.Id;
        }
    }
}
