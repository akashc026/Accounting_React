using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetSalesOrderLinesBySalesOrderIdHandler : GetEntitiesHandler<AccountingDbContext, SalesOrderLine, GetSalesOrderLinesBySalesOrderId, IEnumerable<SalesOrderLineResultDto>>
    {
        public GetSalesOrderLinesBySalesOrderIdHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<SalesOrderLine, bool>> ComposeFilter(Expression<Func<SalesOrderLine, bool>> predicate, GetSalesOrderLinesBySalesOrderId request)
        {
            // Filter by SalesOrder ID (SOID)
            return predicate.And(x => x.SOID == request.SalesOrderId);
        }

        protected override IQueryable<SalesOrderLine> ApplySorting(IQueryable<SalesOrderLine> queryable, GetSalesOrderLinesBySalesOrderId request)
        {
            // Order by creation order (Id) for consistent results
            return queryable.OrderBy(x => x.Id);
        }

        protected override IEnumerable<SalesOrderLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetSalesOrderLinesBySalesOrderId, IEnumerable<SalesOrderLine>> args)
        {
            return Mapper.Map<IEnumerable<SalesOrderLineResultDto>>(args.Result);
        }
    }
} 