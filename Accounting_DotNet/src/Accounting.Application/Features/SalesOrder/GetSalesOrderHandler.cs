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
    public class GetSalesOrderHandler : GetEntityHandler<AccountingDbContext, SalesOrder, Guid, GetSalesOrder, SalesOrderResultDto>
    {
        public GetSalesOrderHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<SalesOrderResultDto?> Handle(GetSalesOrder request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.StatusNavigation)
                    .Include(x => x.Customer)
                    .Include(x => x.FormNavigation)
                    .Include(x => x.Location)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override SalesOrderResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetSalesOrder, SalesOrder?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<SalesOrderResultDto>(entity);
            result.StatusName = entity.StatusNavigation?.Name;
            result.CustomerName = entity.Customer?.Name;
            result.FormName = entity.FormNavigation?.FormName;
            result.LocationName = entity.Location?.Name;
            
            return result;
        }
    }
} 