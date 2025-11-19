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
    public class GetAllVendorBillHandler : GetEntitiesHandler<AccountingDbContext, VendorBill, GetAllVendorBill, PaginatedList<VendorBillResultDto>>
    {
        public GetAllVendorBillHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<VendorBill> ApplyFiltering(IQueryable<VendorBill> queryable, Expression<Func<VendorBill, bool>> predicate, GetAllVendorBill request)
        {
            return queryable
                .Include(x => x.Vendor)
                .Include(x => x.Location)
                .Include(x => x.FormNavigation)
                .Where(predicate);
        }

        protected override Expression<Func<VendorBill, bool>> ComposeFilter(Expression<Func<VendorBill, bool>> predicate, GetAllVendorBill request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.SequenceNumber, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<VendorBill> ApplyPagination(IQueryable<VendorBill> queryable, GetAllVendorBill request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<VendorBillResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllVendorBill, IEnumerable<VendorBill>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<VendorBillResultDto>(entity);
                result.VendorName = entity.Vendor?.Name;
                result.LocationName = entity.Location?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            });

            var request = args.Request;

            return new PaginatedList<VendorBillResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 
