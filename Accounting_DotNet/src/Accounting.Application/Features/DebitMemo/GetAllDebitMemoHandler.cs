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
    public class GetAllDebitMemoHandler : GetEntitiesHandler<AccountingDbContext, DebitMemo, GetAllDebitMemo, PaginatedList<DebitMemoResultDto>>
    {
        public GetAllDebitMemoHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<DebitMemo> ApplyFiltering(IQueryable<DebitMemo> queryable, Expression<Func<DebitMemo, bool>> predicate, GetAllDebitMemo request)
        {
            return queryable
                .Include(x => x.Customer)
                .Include(x => x.FormNavigation)
                .Include(x => x.Location)
                .Include(x => x.StatusNavigation)
                .Where(predicate);
        }

        protected override Expression<Func<DebitMemo, bool>> ComposeFilter(Expression<Func<DebitMemo, bool>> predicate, GetAllDebitMemo request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%"));
            }

            if (request.LocationID.HasValue)
            {
                predicate = predicate.And(x => x.LocationID == request.LocationID.Value);
            }

            return predicate;
        }

        protected override IQueryable<DebitMemo> ApplyPagination(IQueryable<DebitMemo> queryable, GetAllDebitMemo request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<DebitMemoResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllDebitMemo, IEnumerable<DebitMemo>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<DebitMemoResultDto>(entity);
                result.CustomerName = entity.Customer?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                result.LocationName = entity.Location?.Name;
                result.StatusName = entity.StatusNavigation?.Name;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<DebitMemoResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
