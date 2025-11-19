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
    public class CreateCreditMemoLinesHandler : IRequestHandler<CreateCreditMemoLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateCreditMemoLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateCreditMemoLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var creditMemoLine = new CreditMemoLine
                {
                    Id = Guid.NewGuid(),
                    CMID = lineDto.CMID,
                    ItemID = lineDto.ItemID,
                    Quantity = lineDto.Quantity,
                    Rate = lineDto.Rate,
                    TaxID = lineDto.TaxID,
                    TaxPercent = lineDto.TaxPercent,
                    TaxAmount = lineDto.TaxAmount,
                    TotalAmount = lineDto.TotalAmount
                };

                _dbContext.CreditMemoLines.Add(creditMemoLine);
                createdIds.Add(creditMemoLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
