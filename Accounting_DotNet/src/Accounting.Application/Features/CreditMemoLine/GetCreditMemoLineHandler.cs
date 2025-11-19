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
    public class GetCreditMemoLineHandler : GetEntityHandler<AccountingDbContext, CreditMemoLine, Guid, GetCreditMemoLine, CreditMemoLineResultDto>
    {
        public GetCreditMemoLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<CreditMemoLineResultDto?> Handle(GetCreditMemoLine request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.CM)
                    .Include(x => x.Item)
                    .Include(x => x.Tax)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override CreditMemoLineResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetCreditMemoLine, CreditMemoLine?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<CreditMemoLineResultDto>(entity);
            result.ItemName = entity.Item?.ItemName;
            result.TaxName = entity.Tax?.Name;
            
            return result;
        }
    }
}
