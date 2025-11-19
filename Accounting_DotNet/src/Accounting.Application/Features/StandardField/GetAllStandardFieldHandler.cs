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
    public class GetAllStandardFieldHandler : GetEntitiesHandler<AccountingDbContext, StandardField, GetAllStandardField, PaginatedList<StandardFieldResultDto>>
    {
        public GetAllStandardFieldHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<StandardField, bool>> ComposeFilter(Expression<Func<StandardField, bool>> predicate, GetAllStandardField request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.Name, request.SearchText) || 
                                       EF.Functions.Like(x.Source, request.SearchText) ||
                                       EF.Functions.Like(x.Label, request.SearchText));
            }

            return predicate;
        }

        protected override IQueryable<StandardField> ApplyFiltering(IQueryable<StandardField> queryable, Expression<Func<StandardField, bool>> predicate, GetAllStandardField request)
        {
            return queryable
                .Include(x => x.TypeOfRecordNavigation)
                .Include(x => x.FieldTypeNavigation)
                .Where(predicate);
        }

        protected override IQueryable<StandardField> ApplySorting(IQueryable<StandardField> queryable, GetAllStandardField request)
        {
            return queryable.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name);
        }

        protected override IQueryable<StandardField> ApplyPagination(IQueryable<StandardField> queryable, GetAllStandardField request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<StandardFieldResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllStandardField, IEnumerable<StandardField>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<StandardFieldResultDto>(entity);
                result.TypeOfRecordName = entity.TypeOfRecordNavigation?.Name;
                result.FieldTypeName = entity.FieldTypeNavigation?.ComponentName;
                return result;
            });
            
            var request = args.Request;

            return new PaginatedList<StandardFieldResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 