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
    public class GetSalesOrderLineHandler : GetEntityHandler<AccountingDbContext, SalesOrderLine, Guid, GetSalesOrderLine, SalesOrderLineResultDto>
    {
        public GetSalesOrderLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<SalesOrderLineResultDto?> Handle(GetSalesOrderLine request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.SO)
                    .Include(x => x.Item)
                    .Include(x => x.Tax)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override SalesOrderLineResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetSalesOrderLine, SalesOrderLine?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<SalesOrderLineResultDto>(entity);
            
            // TaxAmount is already stored in the database, but ensure it's properly mapped
            // If TaxAmount is 0 but TaxPercent > 0, recalculate it
            if (result.TaxAmount == 0 && entity.TaxPercent > 0)
            {
                result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
            }
            
            return result;
        }
    }
} 