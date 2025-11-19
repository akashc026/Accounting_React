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
    public class GetAllInvoiceLineHandler : GetEntitiesHandler<AccountingDbContext, InvoiceLine, GetAllInvoiceLine, PaginatedList<InvoiceLineResultDto>>
    {
        public GetAllInvoiceLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<InvoiceLine> ApplyPagination(IQueryable<InvoiceLine> queryable, GetAllInvoiceLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override IQueryable<InvoiceLine> ApplyFiltering(IQueryable<InvoiceLine> queryable, Expression<Func<InvoiceLine, bool>> predicate, GetAllInvoiceLine request)
        {
            return queryable
                .Include(x => x.IN)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate);
        }

        protected override Expression<Func<InvoiceLine, bool>> ComposeFilter(Expression<Func<InvoiceLine, bool>> predicate, GetAllInvoiceLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.ItemID.ToString(), request.SearchText) || EF.Functions.Like(x.INID.ToString(), request.SearchText));
            }

            return predicate;
        }

        protected override PaginatedList<InvoiceLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllInvoiceLine, IEnumerable<InvoiceLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<InvoiceLineResultDto>(entity);
                
                // Calculate TaxAmount based on TaxPercent and line total
                if (entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                else
                {
                    result.TaxAmount = 0;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<InvoiceLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 