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
    public class GetVendorPaymentLineHandler : GetEntityHandler<AccountingDbContext, VendorPaymentLine, Guid, GetVendorPaymentLine, VendorPaymentLineResultDto>
    {
        public GetVendorPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<VendorPaymentLineResultDto?> Handle(GetVendorPaymentLine request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override VendorPaymentLineResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetVendorPaymentLine, VendorPaymentLine?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<VendorPaymentLineResultDto>(entity);
            
            return result;
        }
    }
}
