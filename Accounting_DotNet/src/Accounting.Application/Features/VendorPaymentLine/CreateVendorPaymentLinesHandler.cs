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
    public class CreateVendorPaymentLinesHandler : IRequestHandler<CreateVendorPaymentLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateVendorPaymentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateVendorPaymentLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var vendorPaymentLine = new VendorPaymentLine
                {
                    Id = Guid.NewGuid(),
                    PaymentAmount = lineDto.PaymentAmount,
                    RecordID = lineDto.RecordID,
                    IsApplied = lineDto.IsApplied,
                    RefNo = lineDto.RefNo,
                    RecordType = lineDto.RecordType,
                    PaymentId = lineDto.PaymentId,
                    PaymentSeqNum = lineDto.PaymentSeqNum,
                    MainRecordAmount = lineDto.MainRecordAmount,
                    CreatedBy = request.CreatedBy ?? string.Empty
                };

                _dbContext.VendorPaymentLines.Add(vendorPaymentLine);
                createdIds.Add(vendorPaymentLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
