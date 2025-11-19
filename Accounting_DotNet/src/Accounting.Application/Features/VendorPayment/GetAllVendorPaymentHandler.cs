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
    public class GetAllVendorPaymentHandler : GetEntitiesHandler<AccountingDbContext, VendorPayment, GetAllVendorPayment, PaginatedList<VendorPaymentResultDto>>
    {
        public GetAllVendorPaymentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<VendorPayment> ApplyFiltering(IQueryable<VendorPayment> queryable, Expression<Func<VendorPayment, bool>> predicate, GetAllVendorPayment request)
        {
            return queryable
                .Include(x => x.FormNavigation)
                .Include(x => x.VendorNavigation)
                .Include(x => x.LocationNavigation)
                .Include(x => x.StatusNavigation)
                .Where(predicate);
        }

        protected override Expression<Func<VendorPayment, bool>> ComposeFilter(Expression<Func<VendorPayment, bool>> predicate, GetAllVendorPayment request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%"));
            }

            if (request.LocationId.HasValue)
            {
                predicate = predicate.And(x => x.Location == request.LocationId.Value);
            }

            return predicate;
        }

        protected override IQueryable<VendorPayment> ApplyPagination(IQueryable<VendorPayment> queryable, GetAllVendorPayment request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<VendorPaymentResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllVendorPayment, IEnumerable<VendorPayment>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<VendorPaymentResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                result.VendorName = entity.VendorNavigation?.Name;
                result.LocationName = entity.LocationNavigation?.Name;
                result.StatusName = entity.StatusNavigation?.Name;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<VendorPaymentResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
