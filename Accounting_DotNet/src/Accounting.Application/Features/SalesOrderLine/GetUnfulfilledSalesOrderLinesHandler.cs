using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Accounting.Application.Features
{
    public class GetUnfulfilledSalesOrderLinesHandler : GetEntitiesHandler<AccountingDbContext, SalesOrderLine, GetUnfulfilledSalesOrderLines, PaginatedList<SalesOrderLineResultDto>>
    {
        public GetUnfulfilledSalesOrderLinesHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<SalesOrderLine> ApplyFiltering(IQueryable<SalesOrderLine> queryable, Expression<Func<SalesOrderLine, bool>> predicate, GetUnfulfilledSalesOrderLines request)
        {
            var query = queryable
                .Include(x => x.SO)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate)
                .Where(x => (x.FulFillQty ?? 0) < x.Quantity);

            if (request.SOID.HasValue)
            {
                query = query.Where(x => x.SOID == request.SOID.Value);
            }

            return query;
        }

        protected override Expression<Func<SalesOrderLine, bool>> ComposeFilter(Expression<Func<SalesOrderLine, bool>> predicate, GetUnfulfilledSalesOrderLines request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => x.Quantity.ToString().Contains(request.SearchText) || 
                                              x.Rate.ToString().Contains(request.SearchText));
            }

            return predicate;
        }

        protected override PaginatedList<SalesOrderLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetUnfulfilledSalesOrderLines, IEnumerable<SalesOrderLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<SalesOrderLineResultDto>(entity);
                
                if (result.TaxAmount == 0 && entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<SalesOrderLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
