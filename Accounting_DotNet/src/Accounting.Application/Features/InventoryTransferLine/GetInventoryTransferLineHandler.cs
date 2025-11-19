using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class GetInventoryTransferLineHandler : GetEntityHandler<AccountingDbContext, InventoryTransferLine, Guid, GetInventoryTransferLine, InventoryTransferLineResultDto>
    {
        public GetInventoryTransferLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }
    }
}

