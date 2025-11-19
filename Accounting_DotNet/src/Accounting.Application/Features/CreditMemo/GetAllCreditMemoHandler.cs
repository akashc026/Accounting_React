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
    public class GetAllCreditMemoHandler : GetEntitiesHandler<AccountingDbContext, CreditMemo, GetAllCreditMemo, PaginatedList<CreditMemoResultDto>>
    {
        public GetAllCreditMemoHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<CreditMemo> ApplyFiltering(IQueryable<CreditMemo> queryable, Expression<Func<CreditMemo, bool>> predicate, GetAllCreditMemo request)
        {
            return queryable
                .Include(x => x.FormNavigation)
                .Include(x => x.Customer)
                .Include(x => x.Location)
                .Where(predicate);
        }

        protected override Expression<Func<CreditMemo, bool>> ComposeFilter(Expression<Func<CreditMemo, bool>> predicate, GetAllCreditMemo request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%"));
            }

            if (request.LocationId.HasValue)
            {
                predicate = predicate.And(x => x.LocationID == request.LocationId.Value);
            }

            return predicate;
        }

        protected override IQueryable<CreditMemo> ApplyPagination(IQueryable<CreditMemo> queryable, GetAllCreditMemo request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<CreditMemoResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllCreditMemo, IEnumerable<CreditMemo>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<CreditMemoResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                result.CustomerName = entity.Customer?.Name;
                result.LocationName = entity.Location?.Name;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<CreditMemoResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
