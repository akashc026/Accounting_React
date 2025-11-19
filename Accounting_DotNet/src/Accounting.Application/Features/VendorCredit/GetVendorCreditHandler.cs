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
    public class GetVendorCreditHandler : GetEntityHandler<AccountingDbContext, VendorCredit, Guid, GetVendorCredit, VendorCreditResultDto>
    {
        public GetVendorCreditHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<VendorCreditResultDto?> Handle(GetVendorCredit request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.FormNavigation)
                    .Include(x => x.Vendor)
                    .Include(x => x.Location)
                    .Include(x => x.StatusNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override VendorCreditResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetVendorCredit, VendorCredit?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<VendorCreditResultDto>(entity);
            result.FormName = entity.FormNavigation?.FormName;
            result.VendorName = entity.Vendor?.Name;
            result.LocationName = entity.Location?.Name;
            result.StatusName = entity.StatusNavigation?.Name;
            
            return result;
        }
    }
}
