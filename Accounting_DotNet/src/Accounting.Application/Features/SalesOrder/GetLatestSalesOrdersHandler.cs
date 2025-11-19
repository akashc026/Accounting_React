using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Accounting.Application.Features
{
    public class GetLatestSalesOrdersHandler : GetEntitiesHandler<AccountingDbContext, SalesOrder, GetLatestSalesOrders, IEnumerable<SalesOrderResultDto>>
    {
        public GetLatestSalesOrdersHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<SalesOrder, bool>> ComposeFilter(Expression<Func<SalesOrder, bool>> predicate, GetLatestSalesOrders request)
        {
            // Filter by location if specified
            if (request.LocationID.HasValue)
            {
                predicate = predicate.And(x => x.LocationID == request.LocationID.Value);
            }

            return predicate;
        }

        protected override IQueryable<SalesOrder> ApplySorting(IQueryable<SalesOrder> queryable, GetLatestSalesOrders request)
        {
            // Order by SequenceNumber descending (highest number first)
            return queryable.OrderByDescending(x => x.SequenceNumber).ThenByDescending(x => x.Id);
        }

        protected override IQueryable<SalesOrder> ApplyFiltering(IQueryable<SalesOrder> queryable, Expression<Func<SalesOrder, bool>> predicate, GetLatestSalesOrders request)
        {
            return queryable
                .Include(x => x.StatusNavigation)
                .Include(x => x.Customer)
                .Include(x => x.FormNavigation)
                .Include(x => x.Location)
                .Where(predicate);
        }

        protected override IQueryable<SalesOrder> ApplyPagination(IQueryable<SalesOrder> queryable, GetLatestSalesOrders request)
        {
            // Take only the specified count instead of using standard pagination
            return queryable.Take(request.Count);
        }

        protected override IEnumerable<SalesOrderResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetLatestSalesOrders, IEnumerable<SalesOrder>> args)
        {
            var entities = args.Result;
            return entities.Select(entity =>
            {
                var result = Mapper.Map<SalesOrderResultDto>(entity);
                result.StatusName = entity.StatusNavigation?.Name;
                result.CustomerName = entity.Customer?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                result.LocationName = entity.Location?.Name;
                return result;
            });
        }
    }
} 