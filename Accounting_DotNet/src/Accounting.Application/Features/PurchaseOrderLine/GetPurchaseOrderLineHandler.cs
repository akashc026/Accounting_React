using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetPurchaseOrderLineHandler : GetEntityHandler<AccountingDbContext, PurchaseOrderLine, Guid, GetPurchaseOrderLine, PurchaseOrderLineResultDto>
    {
        public GetPurchaseOrderLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<PurchaseOrderLineResultDto?> Handle(GetPurchaseOrderLine request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.PO)
                    .Include(x => x.Item)
                    .Include(x => x.Tax)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override PurchaseOrderLineResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetPurchaseOrderLine, PurchaseOrderLine?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<PurchaseOrderLineResultDto>(entity);
            result.ItemName = entity.Item?.ItemName;
            result.POSequenceNumber = entity.PO?.SequenceNumber;
            result.TaxName = entity.Tax?.Name;
            
            return result;
        }
    }
} 
