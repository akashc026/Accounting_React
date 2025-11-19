using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class GetInventoryAdjustmentLineHandler : GetEntityHandler<AccountingDbContext, InventoryAdjustmentLine, Guid, GetInventoryAdjustmentLine, InventoryAdjustmentLineResultDto>
    {
        public GetInventoryAdjustmentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }
    }
}

