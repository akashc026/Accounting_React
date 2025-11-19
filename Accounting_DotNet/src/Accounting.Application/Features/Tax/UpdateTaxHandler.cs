using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateTaxHandler : IRequestHandler<UpdateTax, Guid>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public UpdateTaxHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<Guid> Handle(UpdateTax request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.Taxes.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (entity == null)
            {
                throw new InvalidOperationException($"Tax with ID {request.Id} not found.");
            }

            // Update fields only if they have valid values
            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                entity.Name = request.Name;
            }

            if (request.TaxRate.HasValue)
            {
                entity.TaxRate = request.TaxRate.Value;
            }

            if (request.TaxAccount.HasValue && request.TaxAccount.Value != Guid.Empty)
            {
                entity.TaxAccount = request.TaxAccount.Value;
            }

            if (request.Inactive.HasValue)
            {
                entity.Inactive = request.Inactive.Value;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}