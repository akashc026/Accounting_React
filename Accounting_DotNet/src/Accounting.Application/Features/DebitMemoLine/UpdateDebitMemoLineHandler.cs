using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateDebitMemoLineHandler : UpdateEntityHandler<AccountingDbContext, DebitMemoLine, Guid, UpdateDebitMemoLine, Guid>
    {
        public UpdateDebitMemoLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateDebitMemoLine, DebitMemoLine> args)
        {
            return args.Entity.Id;
        }
    }
}
