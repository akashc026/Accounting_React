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
            // Build the filter expression similar to other transaction handlers
            Expression<Func<JournalEntry, bool>>? filterExpression = null;
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                var likePattern = $"%{request.SearchText}%";
                Expression<Func<JournalEntry, bool>> searchFilter = x =>
                    EF.Functions.Like(x.SequenceNumber ?? string.Empty, likePattern) ||
                    EF.Functions.Like(x.Memo ?? string.Empty, likePattern) ||
                    EF.Functions.Like(x.RecordID ?? string.Empty, likePattern) ||
                    (x.FormNavigation != null && EF.Functions.Like(x.FormNavigation.FormName!, likePattern));

                filterExpression = searchFilter;
            }

            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override IQueryable<JournalEntry> ApplyFiltering(IQueryable<JournalEntry> queryable, Expression<Func<JournalEntry, bool>> predicate, GetAllJournalEntry request)
        {
            var query = queryable
                .Include(x => x.FormNavigation)
                .Include(x => x.JournalEntryLines)
                    .ThenInclude(x => x.AccountNavigation)
                .Where(predicate);

            if (!string.IsNullOrWhiteSpace(request.SortBy) && request.SortBy.Equals("sequenceNumber", StringComparison.OrdinalIgnoreCase))
            {
                var ascending = string.IsNullOrWhiteSpace(request.SortOrder) || request.SortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase);
                query = ascending ? query.OrderBy(x => x.SequenceNumber) : query.OrderByDescending(x => x.SequenceNumber);
            }

            return query;
        }

        protected override PaginatedList<JournalEntryResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllJournalEntry, IEnumerable<JournalEntry>> args)
        {
            var mappedResults = args.Result.Select(entity => {
                var result = Mapper.Map<JournalEntryResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                if (entity.JournalEntryLines != null && entity.JournalEntryLines.Any())
                {
                    result.JournalEntryLines = entity.JournalEntryLines.Select(line =>
                    {
                        var dto = Mapper.Map<JournalEntryLineDto>(line);
                        dto.AccountName = line.AccountNavigation?.Name;
                        return dto;
                    }).ToList();
                }
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
