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
    public class GetInventoryLedgerHandler : GetEntityHandler<AccountingDbContext, InventoryLedger, Guid, GetInventoryLedger, InventoryLedgerResultDto>
    {
        public GetInventoryLedgerHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override InventoryLedgerResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetInventoryLedger, InventoryLedger?> args)
        {
            return Mapper.Map<InventoryLedgerResultDto>(args.Result!);
        }
    }
} 