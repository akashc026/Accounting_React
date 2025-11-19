using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using MediatR;

namespace Accounting.Application.Features
{
    public class CreateFormHandler : IRequestHandler<CreateForm, Guid>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public CreateFormHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<Guid> Handle(CreateForm request, CancellationToken cancellationToken)
        {
            var entity = new Form
            {
                Id = request.Id,
                FormName = request.FormName,
                TypeOfRecord = request.TypeOfRecord
            };

            // Only set string fields if they have valid values (not null, not empty, not whitespace)
            if (!string.IsNullOrWhiteSpace(request.Prefix))
            {
                entity.Prefix = request.Prefix;
            }

            if (!string.IsNullOrWhiteSpace(request.Reasons))
            {
                entity.Reasons = request.Reasons;
            }

            // Set IsDefault if provided
            if (request.IsDefault.HasValue)
            {
                entity.IsDefault = request.IsDefault.Value;
            }

            // Set Inactive if provided
            if (request.Inactive.HasValue)
            {
                entity.Inactive = request.Inactive.Value;
            }

            // Only set account fields if they have valid values (not null and not empty Guid)
            if (request.AccountReceivable.HasValue && request.AccountReceivable.Value != Guid.Empty)
            {
                entity.AccountReceivable = request.AccountReceivable.Value;
            }

            if (request.Clearing.HasValue && request.Clearing.Value != Guid.Empty)
            {
                entity.Clearing = request.Clearing.Value;
            }
            if (request.AccuredTax.HasValue && request.AccuredTax.Value != Guid.Empty)
            {
                entity.AccuredTax = request.AccuredTax.Value;
            }

            if (request.AccuredAR.HasValue && request.AccuredAR.Value != Guid.Empty)
            {
                entity.AccuredAR = request.AccuredAR.Value;
            }

            if (request.DiscountOnTax.HasValue && request.DiscountOnTax.Value != Guid.Empty)
            {
                entity.DiscountOnTax = request.DiscountOnTax.Value;
            }

            if (request.FormType.HasValue && request.FormType.Value != Guid.Empty)
            {
                entity.FormType = request.FormType.Value;
            }

            if (request.UndepositedFunds.HasValue && request.UndepositedFunds.Value != Guid.Empty)
            {
                entity.UndepositedFunds = request.UndepositedFunds.Value;
            }

            if (request.ClearingGRNI.HasValue && request.ClearingGRNI.Value != Guid.Empty)
            {
                entity.ClearingGRNI = request.ClearingGRNI.Value;
            }

            if (request.ClearingSRNI.HasValue && request.ClearingSRNI.Value != Guid.Empty)
            {
                entity.ClearingSRNI = request.ClearingSRNI.Value;
            }

            if (request.AccountPayable.HasValue && request.AccountPayable.Value != Guid.Empty)
            {
                entity.AccountPayable = request.AccountPayable.Value;
            }

            if (request.ClearingVAT.HasValue && request.ClearingVAT.Value != Guid.Empty)
            {
                entity.ClearingVAT = request.ClearingVAT.Value;
            }

            if (request.DiscountOnTaxDR.HasValue && request.DiscountOnTaxDR.Value != Guid.Empty)
            {
                entity.DiscountOnTaxDR = request.DiscountOnTaxDR.Value;
            }

            if (request.DiscountOnTaxCR.HasValue && request.DiscountOnTaxCR.Value != Guid.Empty)
            {
                entity.DiscountOnTaxCR = request.DiscountOnTaxCR.Value;
            }

            _dbContext.Forms.Add(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}