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
    public class GetAllLocationHandler : GetEntitiesHandler<AccountingDbContext, Location, GetAllLocation, PaginatedList<LocationResultDto>>
    {
        public GetAllLocationHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<Location> ApplyPagination(IQueryable<Location> queryable, GetAllLocation request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<Location, bool>> ComposeFilter(Expression<Func<Location, bool>> predicate, GetAllLocation request)
        {
            // Build the filter expression
            Expression<Func<Location, bool>>? filterExpression = null;

            // Add inactive filter (fallback to IsActive for backward compatibility)
            var inactiveFilterValue = request.Inactive;
            if (!inactiveFilterValue.HasValue && request.IsActive.HasValue)
            {
                inactiveFilterValue = request.IsActive.Value ? false : true;
            }

            if (inactiveFilterValue.HasValue)
            {
                Expression<Func<Location, bool>> inactiveFilter = inactiveFilterValue.Value
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
                Expression<Func<Location, bool>> searchFilter = x =>
                    EF.Functions.Like(x.Name!, likePattern);

                filterExpression = filterExpression == null
                    ? searchFilter
                    : filterExpression.And(searchFilter);
            }

            // Apply the filter if any conditions were added
            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override IQueryable<Location> ApplyFiltering(IQueryable<Location> queryable, Expression<Func<Location, bool>> predicate, GetAllLocation request)
        {
            var query = queryable.Where(predicate);

            if (!string.IsNullOrWhiteSpace(request.SortBy) && request.SortBy.Equals("name", StringComparison.OrdinalIgnoreCase))
            {
                var ascending = string.IsNullOrWhiteSpace(request.SortOrder) || request.SortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase);
                query = ascending ? query.OrderBy(x => x.Name) : query.OrderByDescending(x => x.Name);
            }

            return query;
        }

        protected override PaginatedList<LocationResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllLocation, IEnumerable<Location>> args)
        {
            var mappedResults = Mapper.Map<IEnumerable<LocationResultDto>>(args.Result);
            var request = args.Request;

            return new PaginatedList<LocationResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
