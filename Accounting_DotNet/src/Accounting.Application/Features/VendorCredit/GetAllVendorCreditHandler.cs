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
    public class GetAllVendorCreditHandler : GetEntitiesHandler<AccountingDbContext, VendorCredit, GetAllVendorCredit, PaginatedList<VendorCreditResultDto>>
    {
        public GetAllVendorCreditHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<VendorCredit> ApplyFiltering(IQueryable<VendorCredit> queryable, Expression<Func<VendorCredit, bool>> predicate, GetAllVendorCredit request)
        {
            var query = queryable
                .Include(x => x.FormNavigation)
                .Include(x => x.Vendor)
                .Include(x => x.Location)
                .Include(x => x.StatusNavigation)
                .Where(predicate);

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(request.SortBy) && request.SortBy.Equals("sequenceNumber", StringComparison.OrdinalIgnoreCase))
            {
                var ascending = string.IsNullOrWhiteSpace(request.SortOrder) || request.SortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase);
                query = ascending ? query.OrderBy(x => x.SequenceNumber) : query.OrderByDescending(x => x.SequenceNumber);
            }

            return query;
        }

        protected override Expression<Func<VendorCredit, bool>> ComposeFilter(Expression<Func<VendorCredit, bool>> predicate, GetAllVendorCredit request)
        {
            // Build the filter expression
            Expression<Func<VendorCredit, bool>>? filterExpression = null;

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                filterExpression = x =>
                    EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%")
                    || (x.Vendor != null && EF.Functions.Like(x.Vendor.Name!, $"%{request.SearchText}%"));
            }

            // Add LocationId filter
            if (request.LocationId.HasValue)
            {
                Expression<Func<VendorCredit, bool>> locationFilter = x => x.LocationID == request.LocationId.Value;
                filterExpression = filterExpression == null
                    ? locationFilter
                    : filterExpression.And(locationFilter);
            }

            // Add status filter (open/closed) if provided
            if (!string.IsNullOrWhiteSpace(request.Status) && !request.Status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var normalizedStatus = request.Status.Trim().ToLowerInvariant();
                Expression<Func<VendorCredit, bool>> statusFilter = x =>
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

        protected override IQueryable<VendorCredit> ApplyPagination(IQueryable<VendorCredit> queryable, GetAllVendorCredit request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<VendorCreditResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllVendorCredit, IEnumerable<VendorCredit>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<VendorCreditResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                result.VendorName = entity.Vendor?.Name;
                result.LocationName = entity.Location?.Name;
                result.StatusName = entity.StatusNavigation?.Name;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<VendorCreditResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
