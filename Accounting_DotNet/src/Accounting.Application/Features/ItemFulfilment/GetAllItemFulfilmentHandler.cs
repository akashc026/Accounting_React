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
    public class GetAllItemFulfilmentHandler : GetEntitiesHandler<AccountingDbContext, ItemFulfilment, GetAllItemFulfilment, PaginatedList<ItemFulfilmentResultDto>>
    {
        public GetAllItemFulfilmentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<ItemFulfilment> ApplyPagination(IQueryable<ItemFulfilment> queryable, GetAllItemFulfilment request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<ItemFulfilment, bool>> ComposeFilter(Expression<Func<ItemFulfilment, bool>> predicate, GetAllItemFulfilment request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<ItemFulfilment> ApplyFiltering(IQueryable<ItemFulfilment> queryable, Expression<Func<ItemFulfilment, bool>> predicate, GetAllItemFulfilment request)
        {
            return queryable
                .Include(x => x.Customer)
                .Include(x => x.FormNavigation)
                .Include(x => x.Location)
                .Include(x => x.SO)
                .Include(x => x.StatusNavigation)
                .Where(predicate);
        }

        protected override PaginatedList<ItemFulfilmentResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllItemFulfilment, IEnumerable<ItemFulfilment>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<ItemFulfilmentResultDto>(entity);
                result.CustomerName = entity.Customer?.Name;
                result.LocationName = entity.Location?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                result.SalesOrderNumber = entity.SO?.SequenceNumber;
                result.StatusName = entity.StatusNavigation?.Name;
                return result;
            });
            
            var request = args.Request;

            return new PaginatedList<ItemFulfilmentResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 