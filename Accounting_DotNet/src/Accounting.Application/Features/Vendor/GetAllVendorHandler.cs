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
    public class GetAllVendorHandler : GetEntitiesHandler<AccountingDbContext, Vendor, GetAllVendor, PaginatedList<VendorResultDto>>
    {
        public GetAllVendorHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<Vendor, bool>> ComposeFilter(Expression<Func<Vendor, bool>> predicate, GetAllVendor request)
        {
            // Build the filter expression
            Expression<Func<Vendor, bool>>? filterExpression = null;

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
                Expression<Func<Vendor, bool>> searchFilter = x =>
                    EF.Functions.Like(x.Name, request.SearchText) ||
                    EF.Functions.Like(x.Email, request.SearchText) ||
                    EF.Functions.Like(x.SequenceNumber, request.SearchText);

                filterExpression = filterExpression == null
                    ? searchFilter
                    : filterExpression.And(searchFilter);
            }

            // Apply the filter if any conditions were added
            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override IQueryable<Vendor> ApplyFiltering(IQueryable<Vendor> queryable, Expression<Func<Vendor, bool>> predicate, GetAllVendor request)
        {
            return queryable
                .Include(x => x.FormNavigation)
                .Where(predicate);
        }

        protected override IQueryable<Vendor> ApplyPagination(IQueryable<Vendor> queryable, GetAllVendor request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<VendorResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllVendor, IEnumerable<Vendor>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<VendorResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            });
            
            var request = args.Request;

            return new PaginatedList<VendorResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
