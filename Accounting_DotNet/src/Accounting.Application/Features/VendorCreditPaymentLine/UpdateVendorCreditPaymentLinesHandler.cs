using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateVendorCreditPaymentLinesHandler : IRequestHandler<UpdateVendorCreditPaymentLines, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateVendorCreditPaymentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateVendorCreditPaymentLines request, CancellationToken cancellationToken)
        {
            if (request.Lines == null || !request.Lines.Any())
            {
                return 0;
            }

            var ids = request.Lines.Select(l => l.Id).ToList();
            var existingLines = await _dbContext.VendorCreditPaymentLines
                .Where(line => ids.Contains(line.Id))
                .ToListAsync(cancellationToken);

            if (!existingLines.Any())
            {
                return 0;
            }

            foreach (var existingLine in existingLines)
            {
                var updateDto = request.Lines.FirstOrDefault(l => l.Id == existingLine.Id);
                if (updateDto != null)
                {
                    if (updateDto.PaymentAmount.HasValue)
                        existingLine.PaymentAmount = updateDto.PaymentAmount.Value;

                    if (!string.IsNullOrEmpty(updateDto.RecordID))
                        existingLine.RecordID = updateDto.RecordID;

                    if (updateDto.IsApplied.HasValue)
                        existingLine.IsApplied = updateDto.IsApplied;

                    if (!string.IsNullOrEmpty(updateDto.RefNo))
                        existingLine.RefNo = updateDto.RefNo;

                    if (!string.IsNullOrEmpty(updateDto.RecordType))
                        existingLine.RecordType = updateDto.RecordType;

                    if (updateDto.VCID.HasValue)
                        existingLine.VCID = updateDto.VCID;

                    if (!string.IsNullOrEmpty(updateDto.VendorCreditSeqNum))
                        existingLine.VendorCreditSeqNum = updateDto.VendorCreditSeqNum;

                    if (updateDto.MainRecordAmount.HasValue)
                        existingLine.MainRecordAmount = updateDto.MainRecordAmount;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingLines.Count;
        }
    }
}
