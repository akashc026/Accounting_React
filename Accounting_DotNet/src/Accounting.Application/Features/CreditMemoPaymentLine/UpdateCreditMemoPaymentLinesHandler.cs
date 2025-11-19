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
    public class UpdateCreditMemoPaymentLinesHandler : IRequestHandler<UpdateCreditMemoPaymentLines, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateCreditMemoPaymentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateCreditMemoPaymentLines request, CancellationToken cancellationToken)
        {
            if (request.Lines == null || !request.Lines.Any())
            {
                return 0;
            }

            var ids = request.Lines.Select(l => l.Id).ToList();
            var existingLines = await _dbContext.CreditMemoPaymentLines
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
                    // Only update fields that are provided (not null/empty)
                    if (updateDto.PaymentAmount.HasValue)
                        existingLine.PaymentAmount = updateDto.PaymentAmount.Value;

                    if (!string.IsNullOrEmpty(updateDto.RecordID))
                        existingLine.RecordID = updateDto.RecordID;

                    if (updateDto.IsApplied.HasValue)
                        existingLine.IsApplied = updateDto.IsApplied;

                    if (updateDto.RefNo != null)
                        existingLine.RefNo = updateDto.RefNo;

                    if (updateDto.RecordType != null)
                        existingLine.RecordType = updateDto.RecordType;

                    if (updateDto.CMID.HasValue)
                        existingLine.CMID = updateDto.CMID;

                    if (updateDto.CreditMemoSeqNum != null)
                        existingLine.CreditMemoSeqNum = updateDto.CreditMemoSeqNum;

                    if (updateDto.MainRecordAmount.HasValue)
                        existingLine.MainRecordAmount = updateDto.MainRecordAmount;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingLines.Count;
        }
    }
}
