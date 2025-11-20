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
    public class GetAllCustomerPaymentHandler : GetEntitiesHandler<AccountingDbContext, CustomerPayment, GetAllCustomerPayment, PaginatedList<CustomerPaymentResultDto>>
    {
        public GetAllCustomerPaymentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<CustomerPayment> ApplyFiltering(IQueryable<CustomerPayment> queryable, Expression<Func<CustomerPayment, bool>> predicate, GetAllCustomerPayment request)
        {
            var query = queryable
                .Include(x => x.FormNavigation)
                .Include(x => x.CustomerNavigation)
                .Include(x => x.LocationNavigation)
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

        protected override Expression<Func<CustomerPayment, bool>> ComposeFilter(Expression<Func<CustomerPayment, bool>> predicate, GetAllCustomerPayment request)
        {
            // Build the filter expression
            Expression<Func<CustomerPayment, bool>>? filterExpression = null;

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                filterExpression = x =>
                    EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%")
                    || (x.CustomerNavigation != null && EF.Functions.Like(x.CustomerNavigation.Name!, $"%{request.SearchText}%"));
            }

            // Add LocationId filter
            if (request.LocationId.HasValue)
            {
                Expression<Func<CustomerPayment, bool>> locationFilter = x => x.Location == request.LocationId.Value;
                filterExpression = filterExpression == null
                    ? locationFilter
                    : filterExpression.And(locationFilter);
            }

            // Add status filter (open/closed) if provided
            if (!string.IsNullOrWhiteSpace(request.Status) && !request.Status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var normalizedStatus = request.Status.Trim().ToLowerInvariant();
                Expression<Func<CustomerPayment, bool>> statusFilter = x =>
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

        protected override IQueryable<CustomerPayment> ApplyPagination(IQueryable<CustomerPayment> queryable, GetAllCustomerPayment request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<CustomerPaymentResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllCustomerPayment, IEnumerable<CustomerPayment>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<CustomerPaymentResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                result.CustomerName = entity.CustomerNavigation?.Name;
                result.LocationName = entity.LocationNavigation?.Name;
                result.StatusName = entity.StatusNavigation?.Name;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<CustomerPaymentResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
