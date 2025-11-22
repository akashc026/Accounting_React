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
    public class GetAllTypeOfFieldHandler : GetEntitiesHandler<AccountingDbContext, TypeOfField, GetAllTypeOfField, PaginatedList<TypeOfFieldResultDto>>
    {
        public GetAllTypeOfFieldHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<TypeOfField, bool>> ComposeFilter(Expression<Func<TypeOfField, bool>> predicate, GetAllTypeOfField request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.ComponentName, request.SearchText) || 
                                        EF.Functions.Like(x.PackageName, request.SearchText) ||
                                        EF.Functions.Like(x.Category, request.SearchText) ||
                                        (x.Description != null && EF.Functions.Like(x.Description, request.SearchText)));
            }

            return predicate;
        }

        protected override IQueryable<TypeOfField> ApplyFiltering(IQueryable<TypeOfField> queryable, Expression<Func<TypeOfField, bool>> predicate, GetAllTypeOfField request)
        {
            return queryable
                .Include(x => x.StandardFields)
                .Where(predicate);
        }

        protected override IQueryable<TypeOfField> ApplyPagination(IQueryable<TypeOfField> queryable, GetAllTypeOfField request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<TypeOfFieldResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllTypeOfField, IEnumerable<TypeOfField>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<TypeOfFieldResultDto>(entity);
                result.StandardFieldsCount = entity.StandardFields?.Count ?? 0;
                return result;
            });
            
            var request = args.Request;

            return new PaginatedList<TypeOfFieldResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 
