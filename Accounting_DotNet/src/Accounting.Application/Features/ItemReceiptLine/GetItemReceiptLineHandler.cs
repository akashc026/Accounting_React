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
    public class GetItemReceiptLineHandler : GetEntityHandler<AccountingDbContext, ItemReceiptLine, Guid, GetItemReceiptLine, ItemReceiptLineResultDto>
    {
        public GetItemReceiptLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<ItemReceiptLineResultDto?> Handle(GetItemReceiptLine request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.IR)
                    .Include(x => x.Item)
                    .Include(x => x.Tax)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override ItemReceiptLineResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetItemReceiptLine, ItemReceiptLine?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<ItemReceiptLineResultDto>(entity);
            result.ItemName = entity.Item?.ItemName;
            result.IRSequenceNumber = entity.IR?.SequenceNumber;
            result.TaxName = entity.Tax?.Name;
            
            return result;
        }
    }
} 
