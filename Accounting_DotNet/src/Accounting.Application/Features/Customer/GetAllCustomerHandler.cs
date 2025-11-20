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
    public class GetAllCustomerHandler : GetEntitiesHandler<AccountingDbContext, Customer, GetAllCustomer, PaginatedList<CustomerResultDto>>
    {
        public GetAllCustomerHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<Customer, bool>> ComposeFilter(Expression<Func<Customer, bool>> predicate, GetAllCustomer request)
        {
            // Build the filter expression
            Expression<Func<Customer, bool>>? filterExpression = null;

            // Add inactive filter (fallback to IsActive for backward compatibility)
            var inactiveFilterValue = request.Inactive;
            if (!inactiveFilterValue.HasValue && request.IsActive.HasValue)
            {
                inactiveFilterValue = request.IsActive.Value ? false : true;
            }

            if (inactiveFilterValue.HasValue)
            {
                Expression<Func<Customer, bool>> inactiveFilter = inactiveFilterValue.Value
                    ? x => x.Inactive == true
                    : x => x.Inactive != true;

                filterExpression = filterExpression == null
                    ? inactiveFilter
                    : filterExpression.And(inactiveFilter);
            }

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                var likePattern = $"%{request.SearchText}%";
                Expression<Func<Customer, bool>> searchFilter = x =>
                    EF.Functions.Like(x.Name!, likePattern) ||
                    EF.Functions.Like(x.Email!, likePattern);

                filterExpression = filterExpression == null
                    ? searchFilter
                    : filterExpression.And(searchFilter);
            }

            // Apply the filter if any conditions were added
            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override IQueryable<Customer> ApplyFiltering(IQueryable<Customer> queryable, Expression<Func<Customer, bool>> predicate, GetAllCustomer request)
        {
            var query = queryable
                .Include(x => x.FormNavigation)
                .Where(predicate);

            if (!string.IsNullOrWhiteSpace(request.SortBy) && request.SortBy.Equals("name", StringComparison.OrdinalIgnoreCase))
            {
                var ascending = string.IsNullOrWhiteSpace(request.SortOrder) || request.SortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase);
                query = ascending ? query.OrderBy(x => x.Name) : query.OrderByDescending(x => x.Name);
            }

            return query;
        }

        protected override IQueryable<Customer> ApplyPagination(IQueryable<Customer> queryable, GetAllCustomer request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<CustomerResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllCustomer, IEnumerable<Customer>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<CustomerResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            });
            
            var request = args.Request;

            return new PaginatedList<CustomerResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
