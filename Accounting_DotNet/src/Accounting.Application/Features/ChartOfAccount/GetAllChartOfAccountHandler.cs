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
    public class GetAllChartOfAccountHandler : GetEntitiesHandler<AccountingDbContext, ChartOfAccount, GetAllChartOfAccount, PaginatedList<ChartOfAccountResultDto>>
    {
        public GetAllChartOfAccountHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<ChartOfAccount, bool>> ComposeFilter(Expression<Func<ChartOfAccount, bool>> predicate, GetAllChartOfAccount request)
        {
            // Build the filter expression
            Expression<Func<ChartOfAccount, bool>>? filterExpression = null;

            // Add OnlyNonParent filter
            if (request.OnlyNonParent == true)
            {
                filterExpression = x => x.IsParent != true;
            }

            // Add IsActive filter
            if (request.IsActive == true)
            {
                Expression<Func<ChartOfAccount, bool>> activeFilter = x => x.Inactive != true;
                filterExpression = filterExpression == null
                    ? activeFilter
                    : filterExpression.And(activeFilter);
            }
            else if (request.IsActive == false)
            {
                Expression<Func<ChartOfAccount, bool>> inactiveFilter = x => x.Inactive == true;
                filterExpression = filterExpression == null
                    ? inactiveFilter
                    : filterExpression.And(inactiveFilter);
            }

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                Expression<Func<ChartOfAccount, bool>> searchFilter = x =>
                    EF.Functions.Like(x.Name, request.SearchText) ||
                    EF.Functions.Like(x.AccountNumber, request.SearchText) ||
                    EF.Functions.Like(x.ParentNumber, request.SearchText);

                filterExpression = filterExpression == null
                    ? searchFilter
                    : filterExpression.And(searchFilter);
            }

            // Apply the filter if any conditions were added
            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override IQueryable<ChartOfAccount> ApplyFiltering(IQueryable<ChartOfAccount> queryable, Expression<Func<ChartOfAccount, bool>> predicate, GetAllChartOfAccount request)
        {
            return queryable
                .Include(x => x.ParentNavigation)
                .Include(x => x.AccountTypeNavigation)
                .Where(predicate);
        }

        protected override IQueryable<ChartOfAccount> ApplyPagination(IQueryable<ChartOfAccount> queryable, GetAllChartOfAccount request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<ChartOfAccountResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllChartOfAccount, IEnumerable<ChartOfAccount>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<ChartOfAccountResultDto>(entity);
                result.ParentName = entity.ParentNavigation?.Name;
                result.AccountTypeName = entity.AccountTypeNavigation?.Name;
                return result;
            });
            
            var request = args.Request;

            return new PaginatedList<ChartOfAccountResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 100
            };
        }
    }
}
