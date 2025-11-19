using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateInventoryDetailHandler : CreateEntityHandler<AccountingDbContext, InventoryDetail, Guid, CreateInventoryDetail, Guid>
    {
        public CreateInventoryDetailHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateInventoryDetail, InventoryDetail> args)
        {
            return args.Entity.Id;
        }
    }
}
