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
    public class CreateCreditMemoPaymentLinesHandler : IRequestHandler<CreateCreditMemoPaymentLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateCreditMemoPaymentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateCreditMemoPaymentLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var creditMemoPaymentLine = new CreditMemoPaymentLine
                {
                    Id = Guid.NewGuid(),
                    PaymentAmount = lineDto.PaymentAmount,
                    RecordID = lineDto.RecordID,
                    IsApplied = lineDto.IsApplied,
                    RefNo = lineDto.RefNo,
                    RecordType = lineDto.RecordType,
                    CMID = lineDto.CMID,
                    CreditMemoSeqNum = lineDto.CreditMemoSeqNum,
                    MainRecordAmount = lineDto.MainRecordAmount
                };

                _dbContext.CreditMemoPaymentLines.Add(creditMemoPaymentLine);
                createdIds.Add(creditMemoPaymentLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
