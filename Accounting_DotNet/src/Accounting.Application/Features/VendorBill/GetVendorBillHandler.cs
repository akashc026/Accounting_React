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
    public class GetVendorBillHandler : GetEntityHandler<AccountingDbContext, VendorBill, Guid, GetVendorBill, VendorBillResultDto>
    {
        public GetVendorBillHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<VendorBillResultDto?> Handle(GetVendorBill request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.Vendor)
                    .Include(x => x.Location)
                    .Include(x => x.FormNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override VendorBillResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetVendorBill, VendorBill?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<VendorBillResultDto>(entity);
            result.VendorName = entity.Vendor?.Name;
            result.LocationName = entity.Location?.Name;
            result.FormName = entity.FormNavigation?.FormName;
            
            return result;
        }
    }
} 
