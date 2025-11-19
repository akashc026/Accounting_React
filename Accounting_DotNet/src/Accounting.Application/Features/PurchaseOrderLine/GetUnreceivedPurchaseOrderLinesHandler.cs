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
    public class GetUnreceivedPurchaseOrderLinesHandler : GetEntitiesHandler<AccountingDbContext, PurchaseOrderLine, GetUnreceivedPurchaseOrderLines, PaginatedList<PurchaseOrderLineResultDto>>
    {
        public GetUnreceivedPurchaseOrderLinesHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<PurchaseOrderLine> ApplyFiltering(IQueryable<PurchaseOrderLine> queryable, Expression<Func<PurchaseOrderLine, bool>> predicate, GetUnreceivedPurchaseOrderLines request)
        {
            var query = queryable
                .Include(x => x.PO)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate)
                .Where(x => (x.ReceivedQty ?? 0) < x.Quantity);

            if (request.POID.HasValue)
            {
                query = query.Where(x => x.POID == request.POID.Value);
            }

            return query;
        }

        protected override Expression<Func<PurchaseOrderLine, bool>> ComposeFilter(Expression<Func<PurchaseOrderLine, bool>> predicate, GetUnreceivedPurchaseOrderLines request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => x.Quantity.ToString().Contains(request.SearchText) || 
                                              x.Rate.ToString().Contains(request.SearchText));
            }

            return predicate;
        }

        protected override PaginatedList<PurchaseOrderLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetUnreceivedPurchaseOrderLines, IEnumerable<PurchaseOrderLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<PurchaseOrderLineResultDto>(entity);
                
                if (result.TaxAmount == 0 && entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<PurchaseOrderLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
