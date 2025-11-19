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
    public class GetUnfulfilledItemFulfilmentLinesHandler : GetEntitiesHandler<AccountingDbContext, ItemFulfilmentLine, GetUnfulfilledItemFulfilmentLines, PaginatedList<ItemFulfilmentLineResultDto>>
    {
        public GetUnfulfilledItemFulfilmentLinesHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<ItemFulfilmentLine> ApplyFiltering(IQueryable<ItemFulfilmentLine> queryable, Expression<Func<ItemFulfilmentLine, bool>> predicate, GetUnfulfilledItemFulfilmentLines request)
        {
            var query = queryable
                .Include(x => x.DN)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate)
                .Where(x => (x.InvoicedQty ?? 0) < x.Quantity);

            if (request.DNID.HasValue)
            {
                query = query.Where(x => x.DNID == request.DNID.Value);
            }

            return query;
        }

        protected override Expression<Func<ItemFulfilmentLine, bool>> ComposeFilter(Expression<Func<ItemFulfilmentLine, bool>> predicate, GetUnfulfilledItemFulfilmentLines request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => x.Quantity.ToString().Contains(request.SearchText) || 
                                              x.Rate.ToString().Contains(request.SearchText));
            }

            return predicate;
        }

        protected override PaginatedList<ItemFulfilmentLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetUnfulfilledItemFulfilmentLines, IEnumerable<ItemFulfilmentLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<ItemFulfilmentLineResultDto>(entity);
                
                if (result.TaxAmount == 0 && entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<ItemFulfilmentLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
