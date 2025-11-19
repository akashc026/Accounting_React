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
    public class DeleteCreditMemoPaymentLinesHandler : IRequestHandler<DeleteCreditMemoPaymentLines, int>
    {
        private readonly AccountingDbContext _dbContext;

        public DeleteCreditMemoPaymentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(DeleteCreditMemoPaymentLines request, CancellationToken cancellationToken)
        {
            if (request.Ids == null || !request.Ids.Any())
            {
                return 0;
            }

            var linesToDelete = await _dbContext.CreditMemoPaymentLines
                .Where(line => request.Ids.Contains(line.Id))
                .ToListAsync(cancellationToken);

            if (!linesToDelete.Any())
            {
                return 0;
            }

            _dbContext.CreditMemoPaymentLines.RemoveRange(linesToDelete);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return linesToDelete.Count;
        }
    }
}
