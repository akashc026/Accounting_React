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

            // Add IsActive filter
            if (request.IsActive == true)
            {
                filterExpression = x => x.Inactive != true;
            }
            else if (request.IsActive == false)
            {
                filterExpression = x => x.Inactive == true;
            }

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                Expression<Func<Location, bool>> searchFilter = x =>
                    EF.Functions.Like(x.Name, request.SearchText) ||
                    EF.Functions.Like(x.Address, request.SearchText);

                filterExpression = filterExpression == null
                    ? searchFilter
                    : filterExpression.And(searchFilter);
            }

            // Apply the filter if any conditions were added
            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
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
