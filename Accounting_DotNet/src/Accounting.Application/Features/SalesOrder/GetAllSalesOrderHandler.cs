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
    public class GetAllSalesOrderHandler : GetEntitiesHandler<AccountingDbContext, SalesOrder, GetAllSalesOrder, PaginatedList<SalesOrderResultDto>>
    {
        public GetAllSalesOrderHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<SalesOrder> ApplyPagination(IQueryable<SalesOrder> queryable, GetAllSalesOrder request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override IQueryable<SalesOrder> ApplyFiltering(IQueryable<SalesOrder> queryable, Expression<Func<SalesOrder, bool>> predicate, GetAllSalesOrder request)
        {
            var query = queryable
                .Include(x => x.StatusNavigation)
                .Include(x => x.Customer)
                .Include(x => x.FormNavigation)
                .Include(x => x.Location)
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

        protected override Expression<Func<SalesOrder, bool>> ComposeFilter(Expression<Func<SalesOrder, bool>> predicate, GetAllSalesOrder request)
        {
            // Build the filter expression
            Expression<Func<SalesOrder, bool>>? filterExpression = null;

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                filterExpression = x =>
                    EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%")
                    || (x.Customer != null && EF.Functions.Like(x.Customer.Name!, $"%{request.SearchText}%"));
            }

            // Add LocationID filter
            if (request.LocationID.HasValue)
            {
                Expression<Func<SalesOrder, bool>> locationFilter = x => x.LocationID == request.LocationID.Value;
                filterExpression = filterExpression == null
                    ? locationFilter
                    : filterExpression.And(locationFilter);
            }

            // Add status filter (open/closed) if provided
            if (!string.IsNullOrWhiteSpace(request.Status) && !request.Status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var normalizedStatus = request.Status.Trim().ToLowerInvariant();
                Expression<Func<SalesOrder, bool>> statusFilter = x =>
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

        protected override PaginatedList<SalesOrderResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllSalesOrder, IEnumerable<SalesOrder>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<SalesOrderResultDto>(entity);
                result.StatusName = entity.StatusNavigation?.Name;
                result.CustomerName = entity.Customer?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                result.LocationName = entity.Location?.Name;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<SalesOrderResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 
