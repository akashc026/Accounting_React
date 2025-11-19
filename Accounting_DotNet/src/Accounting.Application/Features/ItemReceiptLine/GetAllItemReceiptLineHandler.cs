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
    public class GetAllItemReceiptLineHandler : GetEntitiesHandler<AccountingDbContext, ItemReceiptLine, GetAllItemReceiptLine, PaginatedList<ItemReceiptLineResultDto>>
    {
        public GetAllItemReceiptLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<ItemReceiptLine> ApplyPagination(IQueryable<ItemReceiptLine> queryable, GetAllItemReceiptLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override IQueryable<ItemReceiptLine> ApplyFiltering(IQueryable<ItemReceiptLine> queryable, Expression<Func<ItemReceiptLine, bool>> predicate, GetAllItemReceiptLine request)
        {
            return queryable
                .Include(x => x.IR)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate);
        }

        protected override Expression<Func<ItemReceiptLine, bool>> ComposeFilter(Expression<Func<ItemReceiptLine, bool>> predicate, GetAllItemReceiptLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.Item.ItemName, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override PaginatedList<ItemReceiptLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllItemReceiptLine, IEnumerable<ItemReceiptLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<ItemReceiptLineResultDto>(entity);
                
                // TaxAmount is already stored in the database, but ensure it's properly mapped
                // If TaxAmount is 0 but TaxPercent > 0, recalculate it
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
