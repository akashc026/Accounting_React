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
    public class GetAllPurchaseOrderHandler : GetEntitiesHandler<AccountingDbContext, PurchaseOrder, GetAllPurchaseOrder, PaginatedList<PurchaseOrderResultDto>>
    {
        public GetAllPurchaseOrderHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<PurchaseOrder> ApplyPagination(IQueryable<PurchaseOrder> queryable, GetAllPurchaseOrder request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override IQueryable<PurchaseOrder> ApplyFiltering(IQueryable<PurchaseOrder> queryable, Expression<Func<PurchaseOrder, bool>> predicate, GetAllPurchaseOrder request)
        {
            return queryable
                .Include(x => x.Vendor)
                .Include(x => x.Location)
                .Include(x => x.FormNavigation)
                .Include(x => x.StatusNavigation)
                .Where(predicate);
        }

        protected override Expression<Func<PurchaseOrder, bool>> ComposeFilter(Expression<Func<PurchaseOrder, bool>> predicate, GetAllPurchaseOrder request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override PaginatedList<PurchaseOrderResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllPurchaseOrder, IEnumerable<PurchaseOrder>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<PurchaseOrderResultDto>(entity);
                result.VendorName = entity.Vendor?.Name;
                result.LocationName = entity.Location?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                result.StatusName = entity.StatusNavigation?.Name;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<PurchaseOrderResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 
