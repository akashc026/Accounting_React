using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetInventoryTransferHandler : GetEntityHandler<AccountingDbContext, InventoryTransfer, Guid, GetInventoryTransfer, InventoryTransferResultDto>
    {
        public GetInventoryTransferHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<InventoryTransferResultDto?> Handle(GetInventoryTransfer request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.Customer)
                    .Include(x => x.FromLocationNavigation)
                    .Include(x => x.ToLocationNavigation)
                    .Include(x => x.FormNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override InventoryTransferResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetInventoryTransfer, InventoryTransfer?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;

            var result = Mapper.Map<InventoryTransferResultDto>(entity);
            result.CustomerName = entity.Customer?.Name;
            result.FromLocationName = entity.FromLocationNavigation?.Name;
            result.ToLocationName = entity.ToLocationNavigation?.Name;
            result.FormName = entity.FormNavigation?.FormName;
            return result;
        }
    }
}

