using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateVendorCreditLinesHandler : IRequestHandler<CreateVendorCreditLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateVendorCreditLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateVendorCreditLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var vendorCreditLine = new VendorCreditLine
                {
                    Id = Guid.NewGuid(),
                    VCID = lineDto.VCID,
                    ItemID = lineDto.ItemID,
                    Quantity = lineDto.Quantity,
                    Rate = lineDto.Rate,
                    TaxId = lineDto.TaxId,
                    TaxPercent = lineDto.TaxPercent,
                    TaxAmount = lineDto.TaxAmount,
                    TotalAmount = lineDto.TotalAmount,
                    CreatedBy = request.CreatedBy ?? string.Empty
                };

                _dbContext.VendorCreditLines.Add(vendorCreditLine);
                createdIds.Add(vendorCreditLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
