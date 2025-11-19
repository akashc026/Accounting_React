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
    public class GetAllRecordTypeHandler : GetEntitiesHandler<AccountingDbContext, RecordType, GetAllRecordType, List<RecordTypeResultDto>>
    {
        public GetAllRecordTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<RecordType, bool>> ComposeFilter(Expression<Func<RecordType, bool>> predicate, GetAllRecordType request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.Name, request.SearchText));
            }

            return predicate;
        }

        protected override IQueryable<RecordType> ApplyFiltering(IQueryable<RecordType> queryable, Expression<Func<RecordType, bool>> predicate, GetAllRecordType request)
        {
            return queryable
                .Include(x => x.StandardFields)
                .Where(predicate);
        }

        protected override IQueryable<RecordType> ApplySorting(IQueryable<RecordType> queryable, GetAllRecordType request)
        {
            return queryable.OrderBy(x => x.Name);
        }

        protected override List<RecordTypeResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllRecordType, IEnumerable<RecordType>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<RecordTypeResultDto>(entity);
                result.StandardFieldsCount = entity.StandardFields?.Count ?? 0;
                return result;
            });
            
            return mappedResults.ToList();
        }
    }
}