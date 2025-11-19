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
    public class GetAllInvoiceHandler : GetEntitiesHandler<AccountingDbContext, Invoice, GetAllInvoice, PaginatedList<InvoiceResultDto>>
    {
        public GetAllInvoiceHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<Invoice> ApplyPagination(IQueryable<Invoice> queryable, GetAllInvoice request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override IQueryable<Invoice> ApplyFiltering(IQueryable<Invoice> queryable, Expression<Func<Invoice, bool>> predicate, GetAllInvoice request)
        {
            var query = queryable
                .Include(x => x.StatusNavigation)
                .Include(x => x.Customer)
                .Include(x => x.FormNavigation)
                .Include(x => x.Location)
                .Include(x => x.DN)
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

        protected override Expression<Func<Invoice, bool>> ComposeFilter(Expression<Func<Invoice, bool>> predicate, GetAllInvoice request)
        {
            // Build the filter expression
            Expression<Func<Invoice, bool>>? filterExpression = null;

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                filterExpression = x =>
                    EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%")
                    || (x.Customer != null && EF.Functions.Like(x.Customer.Name!, $"%{request.SearchText}%"));
            }

            // Apply the filter if any conditions were added
            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override PaginatedList<InvoiceResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllInvoice, IEnumerable<Invoice>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<InvoiceResultDto>(entity);
                result.StatusName = entity.StatusNavigation?.Name;
                result.CustomerName = entity.Customer?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                result.LocationName = entity.Location?.Name;
                result.DNSequenceNumber = entity.DN?.SequenceNumber;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<InvoiceResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}