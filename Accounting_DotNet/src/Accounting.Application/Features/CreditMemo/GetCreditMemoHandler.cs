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
    public class GetCreditMemoHandler : GetEntityHandler<AccountingDbContext, CreditMemo, Guid, GetCreditMemo, CreditMemoResultDto>
    {
        public GetCreditMemoHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<CreditMemoResultDto?> Handle(GetCreditMemo request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.FormNavigation)
                    .Include(x => x.Customer)
                    .Include(x => x.Location)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override CreditMemoResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetCreditMemo, CreditMemo?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<CreditMemoResultDto>(entity);
            result.FormName = entity.FormNavigation?.FormName;
            result.CustomerName = entity.Customer?.Name;
            result.LocationName = entity.Location?.Name;
            
            return result;
        }
    }
}
