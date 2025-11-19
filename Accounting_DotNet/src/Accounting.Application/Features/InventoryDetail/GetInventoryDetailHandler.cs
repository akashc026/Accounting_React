using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetInventoryDetailHandler : GetEntityHandler<AccountingDbContext, InventoryDetail, Guid, GetInventoryDetail, InventoryDetailResultDto>
    {
        public GetInventoryDetailHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<InventoryDetailResultDto?> Handle(GetInventoryDetail request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.Location)
                    .Include(x => x.Item)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override InventoryDetailResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetInventoryDetail, InventoryDetail?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;

            return Mapper.Map<InventoryDetailResultDto>(entity);
        }
    }
}
