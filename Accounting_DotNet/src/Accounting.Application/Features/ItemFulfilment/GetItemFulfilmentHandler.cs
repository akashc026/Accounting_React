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
    public class GetItemFulfilmentHandler : GetEntityHandler<AccountingDbContext, ItemFulfilment, Guid, GetItemFulfilment, ItemFulfilmentResultDto>
    {
        public GetItemFulfilmentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<ItemFulfilmentResultDto?> Handle(GetItemFulfilment request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.Customer)
                    .Include(x => x.FormNavigation)
                    .Include(x => x.Location)
                    .Include(x => x.SO)
                    .Include(x => x.StatusNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override ItemFulfilmentResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetItemFulfilment, ItemFulfilment?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<ItemFulfilmentResultDto>(entity);
            result.CustomerName = entity.Customer?.Name;
            result.LocationName = entity.Location?.Name;
            result.FormName = entity.FormNavigation?.FormName;
            result.SalesOrderNumber = entity.SO?.SequenceNumber;
            result.StatusName = entity.StatusNavigation?.Name;
            
            return result;
        }
    }
} 