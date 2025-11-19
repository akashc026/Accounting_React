using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateDebitMemoLineHandler : CreateEntityHandler<AccountingDbContext, DebitMemoLine, Guid, CreateDebitMemoLine, Guid>
    {
        public CreateDebitMemoLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateDebitMemoLine, DebitMemoLine> args)
        {
            return args.Entity.Id;
        }
    }
}
