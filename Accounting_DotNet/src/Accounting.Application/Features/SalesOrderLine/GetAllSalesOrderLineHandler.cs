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
    public class GetAllSalesOrderLineHandler : GetEntitiesHandler<AccountingDbContext, SalesOrderLine, GetAllSalesOrderLine, PaginatedList<SalesOrderLineResultDto>>
    {
        public GetAllSalesOrderLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<SalesOrderLine> ApplyPagination(IQueryable<SalesOrderLine> queryable, GetAllSalesOrderLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override IQueryable<SalesOrderLine> ApplyFiltering(IQueryable<SalesOrderLine> queryable, Expression<Func<SalesOrderLine, bool>> predicate, GetAllSalesOrderLine request)
        {
            return queryable
                .Include(x => x.SO)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate);
        }

        protected override Expression<Func<SalesOrderLine, bool>> ComposeFilter(Expression<Func<SalesOrderLine, bool>> predicate, GetAllSalesOrderLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => x.Quantity.ToString().Contains(request.SearchText) || 
                                        x.Rate.ToString().Contains(request.SearchText));
            }

            return predicate;
        }

        protected override PaginatedList<SalesOrderLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllSalesOrderLine, IEnumerable<SalesOrderLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<SalesOrderLineResultDto>(entity);
                
                // TaxAmount is already stored in the database, but ensure it's properly mapped
                // If TaxAmount is 0 but TaxPercent > 0, recalculate it
                if (result.TaxAmount == 0 && entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<SalesOrderLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 