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
    public class GetAllVendorCreditHandler : GetEntitiesHandler<AccountingDbContext, VendorCredit, GetAllVendorCredit, PaginatedList<VendorCreditResultDto>>
    {
        public GetAllVendorCreditHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<VendorCredit> ApplyFiltering(IQueryable<VendorCredit> queryable, Expression<Func<VendorCredit, bool>> predicate, GetAllVendorCredit request)
        {
            return queryable
                .Include(x => x.FormNavigation)
                .Include(x => x.Vendor)
                .Include(x => x.Location)
                .Include(x => x.StatusNavigation)
                .Where(predicate);
        }

        protected override Expression<Func<VendorCredit, bool>> ComposeFilter(Expression<Func<VendorCredit, bool>> predicate, GetAllVendorCredit request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%"));
            }

            if (request.LocationId.HasValue)
            {
                predicate = predicate.And(x => x.LocationID == request.LocationId.Value);
            }

            return predicate;
        }

        protected override IQueryable<VendorCredit> ApplyPagination(IQueryable<VendorCredit> queryable, GetAllVendorCredit request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<VendorCreditResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllVendorCredit, IEnumerable<VendorCredit>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<VendorCreditResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                result.VendorName = entity.Vendor?.Name;
                result.LocationName = entity.Location?.Name;
                result.StatusName = entity.StatusNavigation?.Name;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<VendorCreditResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
