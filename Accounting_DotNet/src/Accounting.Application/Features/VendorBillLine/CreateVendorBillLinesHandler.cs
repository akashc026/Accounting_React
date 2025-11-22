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
    public class CreateVendorBillLinesHandler : IRequestHandler<CreateVendorBillLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateVendorBillLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateVendorBillLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var vendorBillLine = new VendorBillLine
                {
                    Id = Guid.NewGuid(),
                    VBID = lineDto.VBID,
                    ItemID = lineDto.ItemID,
                    Quantity = lineDto.Quantity,
                    Rate = lineDto.Rate,
                    TaxID = lineDto.TaxID,
                    TaxPercent = lineDto.TaxPercent,
                    TaxAmount = lineDto.TaxAmount,
                    TotalAmount = lineDto.TotalAmount,
                    IsActive = lineDto.IsActive,
                    ItemReceiptLineId = lineDto.ItemReceiptLineId,
                    CreatedBy = request.CreatedBy ?? string.Empty
                };

                _dbContext.VendorBillLines.Add(vendorBillLine);
                createdIds.Add(vendorBillLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
