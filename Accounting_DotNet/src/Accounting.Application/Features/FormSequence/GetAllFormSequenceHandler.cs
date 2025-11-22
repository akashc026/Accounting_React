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
    public class GetAllFormSequenceHandler : GetEntitiesHandler<AccountingDbContext, FormSequence, GetAllFormSequence, PaginatedList<FormSequenceResultDto>>
    {
        public GetAllFormSequenceHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<FormSequence> ApplyFiltering(IQueryable<FormSequence> queryable, Expression<Func<FormSequence, bool>> predicate, GetAllFormSequence request)
        {
            return queryable
                .Include(x => x.Form)
                .Where(predicate);
        }

        protected override Expression<Func<FormSequence, bool>> ComposeFilter(Expression<Func<FormSequence, bool>> predicate, GetAllFormSequence request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => x.Form != null && EF.Functions.Like(x.Form.FormName, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<FormSequence> ApplyPagination(IQueryable<FormSequence> queryable, GetAllFormSequence request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<FormSequenceResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllFormSequence, IEnumerable<FormSequence>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<FormSequenceResultDto>(entity);
                result.FormName = entity.Form?.FormName ?? string.Empty;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<FormSequenceResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 
