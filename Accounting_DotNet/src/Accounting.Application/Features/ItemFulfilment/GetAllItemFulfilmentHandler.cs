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
    public class GetAllItemFulfilmentHandler : GetEntitiesHandler<AccountingDbContext, ItemFulfilment, GetAllItemFulfilment, PaginatedList<ItemFulfilmentResultDto>>
    {
        public GetAllItemFulfilmentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<ItemFulfilment> ApplyPagination(IQueryable<ItemFulfilment> queryable, GetAllItemFulfilment request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<ItemFulfilment, bool>> ComposeFilter(Expression<Func<ItemFulfilment, bool>> predicate, GetAllItemFulfilment request)
        {
            // Build the filter expression
            Expression<Func<ItemFulfilment, bool>>? filterExpression = null;

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                filterExpression = x =>
                    EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%")
                    || (x.Customer != null && EF.Functions.Like(x.Customer.Name!, $"%{request.SearchText}%"));
            }

            // Add status filter (open/closed) if provided
            if (!string.IsNullOrWhiteSpace(request.Status) && !request.Status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var normalizedStatus = request.Status.Trim().ToLowerInvariant();
                Expression<Func<ItemFulfilment, bool>> statusFilter = x =>
                    x.StatusNavigation != null &&
                    x.StatusNavigation.Name != null &&
                    x.StatusNavigation.Name.ToLower() == normalizedStatus;

                filterExpression = filterExpression == null
                    ? statusFilter
                    : filterExpression.And(statusFilter);
            }

            // Apply the filter if any conditions were added
            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override IQueryable<ItemFulfilment> ApplyFiltering(IQueryable<ItemFulfilment> queryable, Expression<Func<ItemFulfilment, bool>> predicate, GetAllItemFulfilment request)
        {
            var query = queryable
                .Include(x => x.Customer)
                .Include(x => x.FormNavigation)
                .Include(x => x.Location)
                .Include(x => x.SO)
                .Include(x => x.StatusNavigation)
                .Where(predicate);

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(request.SortBy) && request.SortBy.Equals("sequenceNumber", StringComparison.OrdinalIgnoreCase))
            {
                query = string.IsNullOrWhiteSpace(request.SortOrder) || request.SortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase)
                    ? query.OrderBy(x => x.SequenceNumber)
                    : query.OrderByDescending(x => x.SequenceNumber);
            }

            return query;
        }

        protected override PaginatedList<ItemFulfilmentResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllItemFulfilment, IEnumerable<ItemFulfilment>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<ItemFulfilmentResultDto>(entity);
                result.CustomerName = entity.Customer?.Name;
                result.LocationName = entity.Location?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                result.SalesOrderNumber = entity.SO?.SequenceNumber;
                result.StatusName = entity.StatusNavigation?.Name;
                return result;
            });
            
            var request = args.Request;

            return new PaginatedList<ItemFulfilmentResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 
