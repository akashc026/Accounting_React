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
    public class GetAllPurchaseOrderLineHandler : GetEntitiesHandler<AccountingDbContext, PurchaseOrderLine, GetAllPurchaseOrderLine, PaginatedList<PurchaseOrderLineResultDto>>
    {
        public GetAllPurchaseOrderLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<PurchaseOrderLine> ApplyPagination(IQueryable<PurchaseOrderLine> queryable, GetAllPurchaseOrderLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override IQueryable<PurchaseOrderLine> ApplyFiltering(IQueryable<PurchaseOrderLine> queryable, Expression<Func<PurchaseOrderLine, bool>> predicate, GetAllPurchaseOrderLine request)
        {
            return queryable
                .Include(x => x.PO)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate);
        }

        protected override Expression<Func<PurchaseOrderLine, bool>> ComposeFilter(Expression<Func<PurchaseOrderLine, bool>> predicate, GetAllPurchaseOrderLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.Item.ItemName, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override PaginatedList<PurchaseOrderLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllPurchaseOrderLine, IEnumerable<PurchaseOrderLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<PurchaseOrderLineResultDto>(entity);
                
                // TaxAmount is already stored in the database, but ensure it's properly mapped
                // If TaxAmount is 0 but TaxPercent > 0, recalculate it
                if (result.TaxAmount == 0 && entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<PurchaseOrderLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 
