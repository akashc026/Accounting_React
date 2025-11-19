using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetJournalEntryLinesByJournalEntryIdHandler : GetEntitiesHandler<AccountingDbContext, JournalEntryLine, GetJournalEntryLinesByJournalEntryId, IEnumerable<JournalEntryLineResultDto>>
    {
        public GetJournalEntryLinesByJournalEntryIdHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<JournalEntryLine, bool>> ComposeFilter(Expression<Func<JournalEntryLine, bool>> predicate, GetJournalEntryLinesByJournalEntryId request)
        {
            // For now, let's use a simple approach that works with existing data
            // Filter by JEID if it matches, otherwise we need to implement a different strategy
            
            // Since existing data might not have JEID populated and RecordID might be null,
            // let's first try the direct JEID approach
            return predicate.And(x => x.JEID == request.JournalEntryId);
        }

        protected override IQueryable<JournalEntryLine> ApplyFiltering(IQueryable<JournalEntryLine> queryable, Expression<Func<JournalEntryLine, bool>> predicate, GetJournalEntryLinesByJournalEntryId request)
        {
            return queryable
                .Include(x => x.AccountNavigation)
                .Include(x => x.JE)
                .Where(predicate);
        }

        protected override IQueryable<JournalEntryLine> ApplySorting(IQueryable<JournalEntryLine> queryable, GetJournalEntryLinesByJournalEntryId request)
        {
            // Order by creation order (Id) for consistent results
            return queryable.OrderBy(x => x.Id);
        }

        protected override IEnumerable<JournalEntryLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetJournalEntryLinesByJournalEntryId, IEnumerable<JournalEntryLine>> args)
        {
            return args.Result.Select(entity => {
                var result = Mapper.Map<JournalEntryLineResultDto>(entity);
                result.AccountName = entity.AccountNavigation?.Name;
                return result;
            });
        }
    }
}
