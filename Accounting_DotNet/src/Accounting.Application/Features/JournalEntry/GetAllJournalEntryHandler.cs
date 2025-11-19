using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetAllJournalEntryHandler : GetEntitiesHandler<AccountingDbContext, JournalEntry, GetAllJournalEntry, PaginatedList<JournalEntryResultDto>>
    {
        public GetAllJournalEntryHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<JournalEntry> ApplyPagination(IQueryable<JournalEntry> queryable, GetAllJournalEntry request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<JournalEntry, bool>> ComposeFilter(Expression<Func<JournalEntry, bool>> predicate, GetAllJournalEntry request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x =>
                    EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%") ||
                    EF.Functions.Like(x.Memo, $"%{request.SearchText}%") ||
                    EF.Functions.Like(x.RecordID, $"%{request.SearchText}%") ||
                    EF.Functions.Like(x.RecordType, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<JournalEntry> ApplyFiltering(IQueryable<JournalEntry> queryable, Expression<Func<JournalEntry, bool>> predicate, GetAllJournalEntry request)
        {
            return queryable
                .Include(x => x.FormNavigation)
                .Where(predicate);
        }

        protected override PaginatedList<JournalEntryResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllJournalEntry, IEnumerable<JournalEntry>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<JournalEntryResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            });
            
            var request = args.Request;

            return new PaginatedList<JournalEntryResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
