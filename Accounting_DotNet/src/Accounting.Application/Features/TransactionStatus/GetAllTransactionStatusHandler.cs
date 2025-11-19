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
    public class GetAllTransactionStatusHandler : GetEntitiesHandler<AccountingDbContext, TransactionStatus, GetAllTransactionStatus, PaginatedList<TransactionStatusResultDto>>
    {
        public GetAllTransactionStatusHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<TransactionStatus> ApplyFiltering(IQueryable<TransactionStatus> queryable, Expression<Func<TransactionStatus, bool>> predicate, GetAllTransactionStatus request)
        {
            return queryable.Include(x => x.TypeOfRecordNavigation).Where(predicate);
        }

        protected override Expression<Func<TransactionStatus, bool>> ComposeFilter(Expression<Func<TransactionStatus, bool>> predicate, GetAllTransactionStatus request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.Name, request.SearchText));
            }

            return predicate;
        }

        protected override IQueryable<TransactionStatus> ApplyPagination(IQueryable<TransactionStatus> queryable, GetAllTransactionStatus request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<TransactionStatusResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllTransactionStatus, IEnumerable<TransactionStatus>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<TransactionStatusResultDto>(entity);
                result.TypeOfRecordName = entity.TypeOfRecordNavigation?.Name;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<TransactionStatusResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 