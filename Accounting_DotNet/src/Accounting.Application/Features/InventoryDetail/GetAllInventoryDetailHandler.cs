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
    public class GetAllInventoryDetailHandler : GetEntitiesHandler<AccountingDbContext, InventoryDetail, GetAllInventoryDetail, PaginatedList<InventoryDetailResultDto>>
    {
        public GetAllInventoryDetailHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<InventoryDetail> ApplyFiltering(IQueryable<InventoryDetail> queryable, Expression<Func<InventoryDetail, bool>> predicate, GetAllInventoryDetail request)
        {
            return queryable
                .Include(x => x.Location)
                .Include(x => x.Item)
                .Where(predicate);
        }

        protected override IQueryable<InventoryDetail> ApplyPagination(IQueryable<InventoryDetail> queryable, GetAllInventoryDetail request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<InventoryDetail, bool>> ComposeFilter(Expression<Func<InventoryDetail, bool>> predicate, GetAllInventoryDetail request)
        {
            Console.WriteLine($"[DEBUG] ComposeFilter - ItemId: {request.ItemId}, LocationId: {request.LocationId}");

            // Start with a true predicate (no filter) if the incoming predicate is the default
            var result = predicate;
            if (predicate.Body is ConstantExpression constExpr && constExpr.Value is bool boolValue && !boolValue)
            {
                result = x => true;
            }

            // Filter by ItemId if provided
            if (request.ItemId.HasValue)
            {
                var itemId = request.ItemId.Value;
                Console.WriteLine($"[DEBUG] Filtering by ItemId: {itemId}");
                result = result.And(x => x.ItemId == itemId);
            }

            // Filter by LocationId if provided
            if (request.LocationId.HasValue)
            {
                var locationId = request.LocationId.Value;
                Console.WriteLine($"[DEBUG] Filtering by LocationId: {locationId}");
                result = result.And(x => x.LocationId == locationId);
            }

            // Log the final predicate for debugging
            Console.WriteLine($"[DEBUG] Final predicate: {result}");
            return result;
        }

        protected override PaginatedList<InventoryDetailResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllInventoryDetail, IEnumerable<InventoryDetail>> args)
        {
            var mappedResults = Mapper.Map<IEnumerable<InventoryDetailResultDto>>(args.Result);
            var request = args.Request;

            return new PaginatedList<InventoryDetailResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
