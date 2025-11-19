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
    public class GetAllInventoryAdjustmentHandler : GetEntitiesHandler<AccountingDbContext, InventoryAdjustment, GetAllInventoryAdjustment, PaginatedList<InventoryAdjustmentResultDto>>
    {
        public GetAllInventoryAdjustmentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<InventoryAdjustment> ApplyFiltering(IQueryable<InventoryAdjustment> queryable, Expression<Func<InventoryAdjustment, bool>> predicate, GetAllInventoryAdjustment request)
        {
            return queryable
                .Include(x => x.CustomerNavigation)
                .Include(x => x.LocationNavigation)
                .Include(x => x.FormNavigation)
                .Where(predicate);
        }

        protected override Expression<Func<InventoryAdjustment, bool>> ComposeFilter(Expression<Func<InventoryAdjustment, bool>> predicate, GetAllInventoryAdjustment request)
        {
            // Build the filter expression
            Expression<Func<InventoryAdjustment, bool>>? filterExpression = null;

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                filterExpression = x =>
                    (x.LocationNavigation != null && EF.Functions.Like(x.LocationNavigation.Name!, $"%{request.SearchText}%"))
                    || EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%");
            }

            // Apply the filter if any conditions were added
            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override IQueryable<InventoryAdjustment> ApplyPagination(IQueryable<InventoryAdjustment> queryable, GetAllInventoryAdjustment request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<InventoryAdjustmentResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllInventoryAdjustment, IEnumerable<InventoryAdjustment>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<InventoryAdjustmentResultDto>(entity);
                result.LocationName = entity.LocationNavigation?.Name;
                result.CustomerName = entity.CustomerNavigation?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<InventoryAdjustmentResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}

