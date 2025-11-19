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
    public class GetAllItemTypeHandler : GetEntitiesHandler<AccountingDbContext, ItemType, GetAllItemType, PaginatedList<ItemTypeResultDto>>
    {
        public GetAllItemTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<ItemType> ApplyPagination(IQueryable<ItemType> queryable, GetAllItemType request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<ItemType, bool>> ComposeFilter(Expression<Func<ItemType, bool>> predicate, GetAllItemType request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.Name, request.SearchText));
            }

            return predicate;
        }

        protected override PaginatedList<ItemTypeResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllItemType, IEnumerable<ItemType>> args)
        {
            var mappedResults = Mapper.Map<IEnumerable<ItemTypeResultDto>>(args.Result);
            var request = args.Request;

            return new PaginatedList<ItemTypeResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 