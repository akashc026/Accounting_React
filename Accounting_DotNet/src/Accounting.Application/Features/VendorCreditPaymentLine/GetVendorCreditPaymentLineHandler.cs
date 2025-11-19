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
    public class GetVendorCreditPaymentLineHandler : GetEntityHandler<AccountingDbContext, VendorCreditPaymentLine, Guid, GetVendorCreditPaymentLine, VendorCreditPaymentLineResultDto>
    {
        public GetVendorCreditPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }
    }
}
