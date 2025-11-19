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
    public class GetAllAccountTypeHandler : GetEntitiesHandler<AccountingDbContext, AccountType, GetAllAccountType, List<AccountTypeResultDto>>
    {
        public GetAllAccountTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<AccountType, bool>> ComposeFilter(Expression<Func<AccountType, bool>> predicate, GetAllAccountType request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.Name, request.SearchText));
            }

            return predicate;
        }

        protected override IQueryable<AccountType> ApplyFiltering(IQueryable<AccountType> queryable, Expression<Func<AccountType, bool>> predicate, GetAllAccountType request)
        {
            return queryable
                .Where(predicate);
        }

        protected override IQueryable<AccountType> ApplySorting(IQueryable<AccountType> queryable, GetAllAccountType request)
        {
            return queryable.OrderBy(x => x.Name);
        }

        protected override IQueryable<AccountType> ApplyPagination(IQueryable<AccountType> queryable, GetAllAccountType request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override List<AccountTypeResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllAccountType, IEnumerable<AccountType>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<AccountTypeResultDto>(entity);
                return result;
            });
            
            return mappedResults.ToList();
        }
    }
}
