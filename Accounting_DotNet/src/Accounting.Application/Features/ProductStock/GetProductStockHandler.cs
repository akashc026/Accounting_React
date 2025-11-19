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
    public class GetProductStockHandler : GetEntityHandler<AccountingDbContext, ProductStock, Guid, GetProductStock, ProductStockResultDto>
    {
        public GetProductStockHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override ProductStockResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetProductStock, ProductStock?> args)
        {
            return Mapper.Map<ProductStockResultDto>(args.Result!);
        }
    }
} 