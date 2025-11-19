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
    public class GetAllInventoryAdjustmentHandler : GetEntitiesHandler<AccountingDbContext, InventoryAdjustment, GetAllInventoryAdjustment, PaginatedList<InventoryAdjustmentResultDto>>
    {
        public GetAllInventoryAdjustmentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<InventoryAdjustment> ApplyFiltering(IQueryable<InventoryAdjustment> queryable, Expression<Func<InventoryAdjustment, bool>> predicate, GetAllInventoryAdjustment request)
        {
            return queryable
                .Include(x => x.CustomerNavigation)
                .Include(x => x.LocationNavigation)
                .Include(x => x.FormNavigation)
                .Where(predicate);
        }

        protected override Expression<Func<InventoryAdjustment, bool>> ComposeFilter(Expression<Func<InventoryAdjustment, bool>> predicate, GetAllInventoryAdjustment request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.CustomerNavigation!.Name!, $"%{request.SearchText}%")
                    || EF.Functions.Like(x.LocationNavigation!.Name!, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<InventoryAdjustment> ApplyPagination(IQueryable<InventoryAdjustment> queryable, GetAllInventoryAdjustment request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<InventoryAdjustmentResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllInventoryAdjustment, IEnumerable<InventoryAdjustment>> args)
        {
            var mappedResults = Mapper.Map<IEnumerable<InventoryAdjustmentResultDto>>(args.Result);
            var request = args.Request;

            return new PaginatedList<InventoryAdjustmentResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}

