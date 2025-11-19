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
    public class GetCustomerPaymentHandler : GetEntityHandler<AccountingDbContext, CustomerPayment, Guid, GetCustomerPayment, CustomerPaymentResultDto>
    {
        public GetCustomerPaymentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<CustomerPaymentResultDto?> Handle(GetCustomerPayment request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.FormNavigation)
                    .Include(x => x.CustomerNavigation)
                    .Include(x => x.LocationNavigation)
                    .Include(x => x.StatusNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override CustomerPaymentResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetCustomerPayment, CustomerPayment?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<CustomerPaymentResultDto>(entity);
            result.FormName = entity.FormNavigation?.FormName;
            result.CustomerName = entity.CustomerNavigation?.Name;
            result.LocationName = entity.LocationNavigation?.Name;
            result.StatusName = entity.StatusNavigation?.Name;
            
            return result;
        }
    }
}
