using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetFormHandler : GetEntityHandler<AccountingDbContext, Form, Guid, GetForm, FormResultDto>
    {
        public GetFormHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<FormResultDto?> Handle(GetForm request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.TypeOfRecordNavigation)
                    .Include(x => x.AccountReceivableNavigation)
                    .Include(x => x.ClearingNavigation)
                    .Include(x => x.AccuredTaxNavigation)
                    .Include(x => x.AccuredARNavigation)
                    .Include(x => x.DiscountOnTaxNavigation)
                    .Include(x => x.FormTypeNavigation)
                    .Include(x => x.UndepositedFundsNavigation)
                    .Include(x => x.ClearingGRNINavigation)
                    .Include(x => x.ClearingSRNINavigation)
                    .Include(x => x.AccountPayableNavigation)
                    .Include(x => x.ClearingVATNavigation)
                    .Include(x => x.DiscountOnTaxDRNavigation)
                    .Include(x => x.DiscountOnTaxCRNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override FormResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetForm, Form?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<FormResultDto>(entity);
            result.TypeOfRecordName = entity.TypeOfRecordNavigation?.Name ?? string.Empty;
            result.AccountReceivableName = entity.AccountReceivableNavigation?.Name;
            result.ClearingName = entity.ClearingNavigation?.Name;
            result.AccuredTaxName = entity.AccuredTaxNavigation?.Name;
            result.AccuredARName = entity.AccuredARNavigation?.Name;
            result.DiscountOnTaxName = entity.DiscountOnTaxNavigation?.Name;
            result.FormTypeName = entity.FormTypeNavigation?.Name;
            result.UndepositedFundsName = entity.UndepositedFundsNavigation?.Name;
            result.ClearingGRNIName = entity.ClearingGRNINavigation?.Name;
            result.ClearingSRNIName = entity.ClearingSRNINavigation?.Name;
            result.AccountPayableName = entity.AccountPayableNavigation?.Name;
            result.ClearingVATName = entity.ClearingVATNavigation?.Name;
            result.DiscountOnTaxDRName = entity.DiscountOnTaxDRNavigation?.Name;
            result.DiscountOnTaxCRName = entity.DiscountOnTaxCRNavigation?.Name;
            return result;
        }
    }
} 