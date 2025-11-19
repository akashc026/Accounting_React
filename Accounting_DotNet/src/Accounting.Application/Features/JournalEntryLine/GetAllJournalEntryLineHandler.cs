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
    public class GetAllJournalEntryLineHandler : GetEntitiesHandler<AccountingDbContext, JournalEntryLine, GetAllJournalEntryLine, PaginatedList<JournalEntryLineResultDto>>
    {
        public GetAllJournalEntryLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<JournalEntryLine> ApplyPagination(IQueryable<JournalEntryLine> queryable, GetAllJournalEntryLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<JournalEntryLine, bool>> ComposeFilter(Expression<Func<JournalEntryLine, bool>> predicate, GetAllJournalEntryLine request)
        {
            // Apply RecordID filter if provided
            if (!string.IsNullOrEmpty(request.RecordID))
            {
                predicate = predicate.And(x => x.RecordID == request.RecordID);
            }

            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x =>
                    EF.Functions.Like(x.Memo, $"%{request.SearchText}%") ||
                    EF.Functions.Like(x.RecordID, $"%{request.SearchText}%") ||
                    EF.Functions.Like(x.RecordType, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<JournalEntryLine> ApplyFiltering(IQueryable<JournalEntryLine> queryable, Expression<Func<JournalEntryLine, bool>> predicate, GetAllJournalEntryLine request)
        {
            return queryable
                .Include(x => x.AccountNavigation)
                .Include(x => x.JE)
                .Where(predicate);
        }

        protected override PaginatedList<JournalEntryLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllJournalEntryLine, IEnumerable<JournalEntryLine>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<JournalEntryLineResultDto>(entity);
                result.AccountName = entity.AccountNavigation?.Name;
                return result;
            });
            
            var request = args.Request;

            return new PaginatedList<JournalEntryLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
