using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetInventoryAdjustmentHandler : GetEntityHandler<AccountingDbContext, InventoryAdjustment, Guid, GetInventoryAdjustment, InventoryAdjustmentResultDto>
    {
        public GetInventoryAdjustmentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<InventoryAdjustmentResultDto?> Handle(GetInventoryAdjustment request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.CustomerNavigation)
                    .Include(x => x.LocationNavigation)
                    .Include(x => x.FormNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override InventoryAdjustmentResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetInventoryAdjustment, InventoryAdjustment?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;

            var result = Mapper.Map<InventoryAdjustmentResultDto>(entity);
            result.CustomerName = entity.CustomerNavigation?.Name;
            result.LocationName = entity.LocationNavigation?.Name;
            result.FormName = entity.FormNavigation?.FormName;
            return result;
        }
    }
}

