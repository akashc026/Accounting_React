using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetFormsByTypeOfRecordHandler : IRequestHandler<GetFormsByTypeOfRecord, List<FormResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetFormsByTypeOfRecordHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<FormResultDto>> Handle(GetFormsByTypeOfRecord request, CancellationToken cancellationToken)
        {
            // Only include essential navigation properties to improve performance
            // Filter to only return active forms (Inactive != true)
            var forms = await _dbContext.Forms
                .Include(x => x.TypeOfRecordNavigation)
                .Include(x => x.FormTypeNavigation)
                .Where(x => x.TypeOfRecord == request.TypeOfRecord && x.Inactive != true)
                .OrderBy(x => x.FormName)
                .ToListAsync(cancellationToken);

            // Get all unique account IDs from the forms
            var accountIds = new HashSet<Guid>();
            
            foreach (var form in forms)
            {
                if (form.AccountReceivable.HasValue) accountIds.Add(form.AccountReceivable.Value);
                if (form.Clearing.HasValue) accountIds.Add(form.Clearing.Value);
                if (form.AccuredTax.HasValue) accountIds.Add(form.AccuredTax.Value);
                if (form.AccuredAR.HasValue) accountIds.Add(form.AccuredAR.Value);
                if (form.DiscountOnTax.HasValue) accountIds.Add(form.DiscountOnTax.Value);
                if (form.UndepositedFunds.HasValue) accountIds.Add(form.UndepositedFunds.Value);
                if (form.ClearingGRNI.HasValue) accountIds.Add(form.ClearingGRNI.Value);
                if (form.ClearingSRNI.HasValue) accountIds.Add(form.ClearingSRNI.Value);
                if (form.AccountPayable.HasValue) accountIds.Add(form.AccountPayable.Value);
                if (form.ClearingVAT.HasValue) accountIds.Add(form.ClearingVAT.Value);
                if (form.DiscountOnTaxDR.HasValue) accountIds.Add(form.DiscountOnTaxDR.Value);
                if (form.DiscountOnTaxCR.HasValue) accountIds.Add(form.DiscountOnTaxCR.Value);
            }

            // Load account names in a single query if there are any account IDs
            var accountNames = accountIds.Any() 
                ? await _dbContext.ChartOfAccounts
                    .Where(a => accountIds.Contains(a.Id))
                    .ToDictionaryAsync(a => a.Id, a => a.Name, cancellationToken)
                : new Dictionary<Guid, string>();

            return forms.Select(entity => {
                var result = _mapper.Map<FormResultDto>(entity);
                result.TypeOfRecordName = entity.TypeOfRecordNavigation?.Name ?? string.Empty;
                result.FormTypeName = entity.FormTypeNavigation?.Name;
                
                // Map account names using the dictionary lookup
                result.AccountReceivableName = entity.AccountReceivable.HasValue && accountNames.ContainsKey(entity.AccountReceivable.Value) 
                    ? accountNames[entity.AccountReceivable.Value] : null;
                result.ClearingName = entity.Clearing.HasValue && accountNames.ContainsKey(entity.Clearing.Value) 
                    ? accountNames[entity.Clearing.Value] : null;
                result.AccuredTaxName = entity.AccuredTax.HasValue && accountNames.ContainsKey(entity.AccuredTax.Value) 
                    ? accountNames[entity.AccuredTax.Value] : null;
                result.AccuredARName = entity.AccuredAR.HasValue && accountNames.ContainsKey(entity.AccuredAR.Value) 
                    ? accountNames[entity.AccuredAR.Value] : null;
                result.DiscountOnTaxName = entity.DiscountOnTax.HasValue && accountNames.ContainsKey(entity.DiscountOnTax.Value) 
                    ? accountNames[entity.DiscountOnTax.Value] : null;
                result.UndepositedFundsName = entity.UndepositedFunds.HasValue && accountNames.ContainsKey(entity.UndepositedFunds.Value) 
                    ? accountNames[entity.UndepositedFunds.Value] : null;
                result.ClearingGRNIName = entity.ClearingGRNI.HasValue && accountNames.ContainsKey(entity.ClearingGRNI.Value) 
                    ? accountNames[entity.ClearingGRNI.Value] : null;
                result.ClearingSRNIName = entity.ClearingSRNI.HasValue && accountNames.ContainsKey(entity.ClearingSRNI.Value) 
                    ? accountNames[entity.ClearingSRNI.Value] : null;
                result.AccountPayableName = entity.AccountPayable.HasValue && accountNames.ContainsKey(entity.AccountPayable.Value)
                    ? accountNames[entity.AccountPayable.Value] : null;
                result.ClearingVATName = entity.ClearingVAT.HasValue && accountNames.ContainsKey(entity.ClearingVAT.Value)
                    ? accountNames[entity.ClearingVAT.Value] : null;
                result.DiscountOnTaxDRName = entity.DiscountOnTaxDR.HasValue && accountNames.ContainsKey(entity.DiscountOnTaxDR.Value)
                    ? accountNames[entity.DiscountOnTaxDR.Value] : null;
                result.DiscountOnTaxCRName = entity.DiscountOnTaxCR.HasValue && accountNames.ContainsKey(entity.DiscountOnTaxCR.Value)
                    ? accountNames[entity.DiscountOnTaxCR.Value] : null;

                return result;
            }).ToList();
        }
    }
} 