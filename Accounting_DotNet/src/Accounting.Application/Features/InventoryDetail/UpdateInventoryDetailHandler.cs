using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateInventoryDetailHandler : UpdateEntityHandler<AccountingDbContext, InventoryDetail, Guid, UpdateInventoryDetail, Guid>
    {
        public UpdateInventoryDetailHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateInventoryDetail, InventoryDetail> args)
        {
            return args.Entity.Id;
        }
    }
}
