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
    public class GetAllInventoryLedgerHandler : GetEntitiesHandler<AccountingDbContext, InventoryLedger, GetAllInventoryLedger, PaginatedList<InventoryLedgerResultDto>>
    {
        public GetAllInventoryLedgerHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<InventoryLedger> ApplyPagination(IQueryable<InventoryLedger> queryable, GetAllInventoryLedger request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<InventoryLedger, bool>> ComposeFilter(Expression<Func<InventoryLedger, bool>> predicate, GetAllInventoryLedger request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.ReferenceId, request.SearchText) || EF.Functions.Like(x.TransactionType, request.SearchText));
            }

            return predicate;
        }

        protected override PaginatedList<InventoryLedgerResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllInventoryLedger, IEnumerable<InventoryLedger>> args)
        {
            var mappedResults = Mapper.Map<IEnumerable<InventoryLedgerResultDto>>(args.Result);
            var request = args.Request;

            return new PaginatedList<InventoryLedgerResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 