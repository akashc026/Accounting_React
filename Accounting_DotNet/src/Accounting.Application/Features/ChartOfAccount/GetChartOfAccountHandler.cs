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
    public class GetChartOfAccountHandler : GetEntityHandler<AccountingDbContext, ChartOfAccount, Guid, GetChartOfAccount, ChartOfAccountResultDto>
    {
        public GetChartOfAccountHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<ChartOfAccountResultDto?> Handle(GetChartOfAccount request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.ParentNavigation)
                    .Include(x => x.AccountTypeNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override ChartOfAccountResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetChartOfAccount, ChartOfAccount?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<ChartOfAccountResultDto>(entity);
            result.ParentName = entity.ParentNavigation?.Name;
            result.AccountTypeName = entity.AccountTypeNavigation?.Name;
            return result;
        }
    }
}
