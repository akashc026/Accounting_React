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
    public class CreateVendorCreditPaymentLinesHandler : IRequestHandler<CreateVendorCreditPaymentLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateVendorCreditPaymentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateVendorCreditPaymentLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var vendorCreditPaymentLine = new VendorCreditPaymentLine
                {
                    Id = Guid.NewGuid(),
                    PaymentAmount = lineDto.PaymentAmount,
                    RecordID = lineDto.RecordID,
                    IsApplied = lineDto.IsApplied,
                    RefNo = lineDto.RefNo,
                    RecordType = lineDto.RecordType,
                    VCID = lineDto.VCID,
                    VendorCreditSeqNum = lineDto.VendorCreditSeqNum,
                    MainRecordAmount = lineDto.MainRecordAmount,
                    CreatedBy = request.CreatedBy ?? string.Empty
                };

                _dbContext.VendorCreditPaymentLines.Add(vendorCreditPaymentLine);
                createdIds.Add(vendorCreditPaymentLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
