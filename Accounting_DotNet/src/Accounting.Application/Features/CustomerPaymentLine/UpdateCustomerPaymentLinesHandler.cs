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
    public class UpdateCustomerPaymentLinesHandler : IRequestHandler<UpdateCustomerPaymentLines, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateCustomerPaymentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateCustomerPaymentLines request, CancellationToken cancellationToken)
        {
            if (request.Lines == null || !request.Lines.Any())
            {
                return 0;
            }

            var ids = request.Lines.Select(l => l.Id).ToList();
            var existingLines = await _dbContext.CustomerPaymentLines
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
                    // Only update fields that are provided (not null)
                    if (updateDto.PaymentAmount.HasValue)
                        existingLine.PaymentAmount = updateDto.PaymentAmount.Value;

                    if (updateDto.RecordID != null)
                        existingLine.RecordID = updateDto.RecordID;

                    if (updateDto.IsApplied.HasValue)
                        existingLine.IsApplied = updateDto.IsApplied;

                    if (updateDto.RefNo != null)
                        existingLine.RefNo = updateDto.RefNo;

                    if (updateDto.RecordType != null)
                        existingLine.RecordType = updateDto.RecordType;

                    if (updateDto.PaymentId.HasValue)
                        existingLine.PaymentId = updateDto.PaymentId;

                    if (updateDto.PaymentSeqNum != null)
                        existingLine.PaymentSeqNum = updateDto.PaymentSeqNum;

                    if (updateDto.MainRecordAmount.HasValue)
                        existingLine.MainRecordAmount = updateDto.MainRecordAmount;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingLines.Count;
        }
    }
}
