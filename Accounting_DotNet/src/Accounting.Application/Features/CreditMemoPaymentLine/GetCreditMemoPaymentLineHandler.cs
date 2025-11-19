using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetCreditMemoPaymentLineHandler : GetEntityHandler<AccountingDbContext, CreditMemoPaymentLine, Guid, GetCreditMemoPaymentLine, CreditMemoPaymentLineResultDto>
    {
        public GetCreditMemoPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override CreditMemoPaymentLineResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetCreditMemoPaymentLine, CreditMemoPaymentLine?> args)
        {
            return Mapper.Map<CreditMemoPaymentLineResultDto>(args.Result!);
        }
    }
}
