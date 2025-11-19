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
    public class GetAllInventoryAdjustmentLineHandler : GetEntitiesHandler<AccountingDbContext, InventoryAdjustmentLine, GetAllInventoryAdjustmentLine, PaginatedList<InventoryAdjustmentLineResultDto>>
    {
        public GetAllInventoryAdjustmentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<InventoryAdjustmentLine, bool>> ComposeFilter(Expression<Func<InventoryAdjustmentLine, bool>> predicate, GetAllInventoryAdjustmentLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => x.QuantityAdjusted.ToString().Contains(request.SearchText)
                                       || x.Rate!.ToString()!.Contains(request.SearchText));
            }

            return predicate;
        }

        protected override IQueryable<InventoryAdjustmentLine> ApplyPagination(IQueryable<InventoryAdjustmentLine> queryable, GetAllInventoryAdjustmentLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<InventoryAdjustmentLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllInventoryAdjustmentLine, IEnumerable<InventoryAdjustmentLine>> args)
        {
            var mappedResults = Mapper.Map<IEnumerable<InventoryAdjustmentLineResultDto>>(args.Result);
            var request = args.Request;

            return new PaginatedList<InventoryAdjustmentLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}

