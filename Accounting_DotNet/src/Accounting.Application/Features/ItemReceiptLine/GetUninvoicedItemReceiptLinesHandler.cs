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
    public class GetUninvoicedItemReceiptLinesHandler : GetEntitiesHandler<AccountingDbContext, ItemReceiptLine, GetUninvoicedItemReceiptLines, PaginatedList<ItemReceiptLineResultDto>>
    {
        public GetUninvoicedItemReceiptLinesHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<ItemReceiptLine> ApplyFiltering(IQueryable<ItemReceiptLine> queryable, Expression<Func<ItemReceiptLine, bool>> predicate, GetUninvoicedItemReceiptLines request)
        {
            var query = queryable
                .Include(x => x.IR)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate)
                .Where(x => (x.InvoicedQty ?? 0) < x.Quantity);

            if (request.IRID.HasValue)
            {
                query = query.Where(x => x.IRID == request.IRID.Value);
            }

            return query;
        }

        protected override Expression<Func<ItemReceiptLine, bool>> ComposeFilter(Expression<Func<ItemReceiptLine, bool>> predicate, GetUninvoicedItemReceiptLines request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => x.Quantity.ToString().Contains(request.SearchText) || 
                                              x.Rate.ToString().Contains(request.SearchText));
            }

            return predicate;
        }

        protected override PaginatedList<ItemReceiptLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetUninvoicedItemReceiptLines, IEnumerable<ItemReceiptLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<ItemReceiptLineResultDto>(entity);
                
                if (result.TaxAmount == 0 && entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<ItemReceiptLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
