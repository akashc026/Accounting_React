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
    public class GetCustomerPaymentLineHandler : GetEntityHandler<AccountingDbContext, CustomerPaymentLine, Guid, GetCustomerPaymentLine, CustomerPaymentLineResultDto>
    {
        public GetCustomerPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<CustomerPaymentLineResultDto?> Handle(GetCustomerPaymentLine request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override CustomerPaymentLineResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetCustomerPaymentLine, CustomerPaymentLine?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<CustomerPaymentLineResultDto>(entity);
            
            return result;
        }
    }
}
