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
    public class GetAllInventoryTransferLineHandler : GetEntitiesHandler<AccountingDbContext, InventoryTransferLine, GetAllInventoryTransferLine, PaginatedList<InventoryTransferLineResultDto>>
    {
        public GetAllInventoryTransferLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<InventoryTransferLine> ApplyPagination(IQueryable<InventoryTransferLine> queryable, GetAllInventoryTransferLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<InventoryTransferLine, bool>> ComposeFilter(Expression<Func<InventoryTransferLine, bool>> predicate, GetAllInventoryTransferLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => x.QuantityTransfer.ToString().Contains(request.SearchText)
                                       || x.Rate!.ToString()!.Contains(request.SearchText));
            }

            return predicate;
        }

        protected override PaginatedList<InventoryTransferLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllInventoryTransferLine, IEnumerable<InventoryTransferLine>> args)
        {
            var mappedResults = Mapper.Map<IEnumerable<InventoryTransferLineResultDto>>(args.Result);
            var request = args.Request;

            return new PaginatedList<InventoryTransferLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}

