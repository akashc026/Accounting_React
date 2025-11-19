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
    public class GetAllProductStockHandler : GetEntitiesHandler<AccountingDbContext, ProductStock, GetAllProductStock, PaginatedList<ProductStockResultDto>>
    {
        public GetAllProductStockHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<ProductStock> ApplyPagination(IQueryable<ProductStock> queryable, GetAllProductStock request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<ProductStock, bool>> ComposeFilter(Expression<Func<ProductStock, bool>> predicate, GetAllProductStock request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.ItemID.ToString(), request.SearchText) || EF.Functions.Like(x.LocationID.ToString(), request.SearchText));
            }

            return predicate;
        }

        protected override PaginatedList<ProductStockResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllProductStock, IEnumerable<ProductStock>> args)
        {
            var mappedResults = Mapper.Map<IEnumerable<ProductStockResultDto>>(args.Result);
            var request = args.Request;

            return new PaginatedList<ProductStockResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 