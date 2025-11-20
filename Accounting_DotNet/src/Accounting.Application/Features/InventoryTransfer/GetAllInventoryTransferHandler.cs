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
    public class GetAllInventoryTransferHandler : GetEntitiesHandler<AccountingDbContext, InventoryTransfer, GetAllInventoryTransfer, PaginatedList<InventoryTransferResultDto>>
    {
        public GetAllInventoryTransferHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<InventoryTransfer> ApplyPagination(IQueryable<InventoryTransfer> queryable, GetAllInventoryTransfer request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override IQueryable<InventoryTransfer> ApplyFiltering(IQueryable<InventoryTransfer> queryable, Expression<Func<InventoryTransfer, bool>> predicate, GetAllInventoryTransfer request)
        {
            var query = queryable
                .Include(x => x.Customer)
                .Include(x => x.FromLocationNavigation)
                .Include(x => x.ToLocationNavigation)
                .Include(x => x.FormNavigation)
                .Where(predicate);

            if (!string.IsNullOrWhiteSpace(request.SortBy) && request.SortBy.Equals("sequenceNumber", StringComparison.OrdinalIgnoreCase))
            {
                var ascending = string.IsNullOrWhiteSpace(request.SortOrder) || request.SortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase);
                query = ascending ? query.OrderBy(x => x.SequenceNumber) : query.OrderByDescending(x => x.SequenceNumber);
            }

            return query;
        }

        protected override Expression<Func<InventoryTransfer, bool>> ComposeFilter(Expression<Func<InventoryTransfer, bool>> predicate, GetAllInventoryTransfer request)
        {
            // Build the filter expression
            Expression<Func<InventoryTransfer, bool>>? filterExpression = null;

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                filterExpression = x =>
                    (x.FromLocationNavigation != null && EF.Functions.Like(x.FromLocationNavigation.Name!, $"%{request.SearchText}%"))
                    || (x.ToLocationNavigation != null && EF.Functions.Like(x.ToLocationNavigation.Name!, $"%{request.SearchText}%"))
                    || EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%");
            }

            // Apply the filter if any conditions were added
            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override PaginatedList<InventoryTransferResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllInventoryTransfer, IEnumerable<InventoryTransfer>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<InventoryTransferResultDto>(entity);
                result.FromLocationName = entity.FromLocationNavigation?.Name;
                result.ToLocationName = entity.ToLocationNavigation?.Name;
                result.CustomerName = entity.Customer?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<InventoryTransferResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
