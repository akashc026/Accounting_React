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
    public class GetAllStatusHandler : GetEntitiesHandler<AccountingDbContext, Status, GetAllStatus, PaginatedList<StatusResultDto>>
    {
        public GetAllStatusHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<Status, bool>> ComposeFilter(Expression<Func<Status, bool>> predicate, GetAllStatus request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.Name, request.SearchText));
            }

            return predicate;
        }

        protected override IQueryable<Status> ApplyPagination(IQueryable<Status> queryable, GetAllStatus request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<StatusResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllStatus, IEnumerable<Status>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<StatusResultDto>(entity);
                return result;
            });

            var request = args.Request;

            return new PaginatedList<StatusResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? (int)args.Count
            };
        }
    }
}
