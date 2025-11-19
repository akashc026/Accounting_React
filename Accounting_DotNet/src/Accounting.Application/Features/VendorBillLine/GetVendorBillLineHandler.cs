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
    public class GetVendorBillLineHandler : GetEntityHandler<AccountingDbContext, VendorBillLine, Guid, GetVendorBillLine, VendorBillLineResultDto>
    {
        public GetVendorBillLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<VendorBillLineResultDto?> Handle(GetVendorBillLine request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.VB)
                    .Include(x => x.Item)
                    .Include(x => x.Tax)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override VendorBillLineResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetVendorBillLine, VendorBillLine?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<VendorBillLineResultDto>(entity);
            result.ItemName = entity.Item?.ItemName;
            result.VBSequenceNumber = entity.VB?.SequenceNumber;
            result.TaxName = entity.Tax?.Name;
            
            return result;
        }
    }
} 
