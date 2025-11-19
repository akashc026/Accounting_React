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
    public class GetAllItemReceiptHandler : GetEntitiesHandler<AccountingDbContext, ItemReceipt, GetAllItemReceipt, PaginatedList<ItemReceiptResultDto>>
    {
        public GetAllItemReceiptHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<ItemReceipt> ApplyPagination(IQueryable<ItemReceipt> queryable, GetAllItemReceipt request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override IQueryable<ItemReceipt> ApplyFiltering(IQueryable<ItemReceipt> queryable, Expression<Func<ItemReceipt, bool>> predicate, GetAllItemReceipt request)
        {
            return queryable
                .Include(x => x.Vendor)
                .Include(x => x.PO)
                .Include(x => x.Location)
                .Include(x => x.FormNavigation)
                .Include(x => x.StatusNavigation)
                .Where(predicate);
        }

        protected override Expression<Func<ItemReceipt, bool>> ComposeFilter(Expression<Func<ItemReceipt, bool>> predicate, GetAllItemReceipt request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override PaginatedList<ItemReceiptResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllItemReceipt, IEnumerable<ItemReceipt>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<ItemReceiptResultDto>(entity);
                result.VendorName = entity.Vendor?.Name;
                result.LocationName = entity.Location?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                result.StatusName = entity.StatusNavigation?.Name;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<ItemReceiptResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 
