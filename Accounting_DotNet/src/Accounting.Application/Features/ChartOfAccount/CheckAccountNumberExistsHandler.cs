using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class CheckAccountNumberExistsHandler : IRequestHandler<CheckAccountNumberExists, bool>
    {
        private readonly AccountingDbContext _dbContext;

        public CheckAccountNumberExistsHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<bool> Handle(CheckAccountNumberExists request, CancellationToken cancellationToken)
        {
            return await _dbContext.ChartOfAccounts
                .AnyAsync(x => x.AccountNumber == request.AccountNumber, cancellationToken);
        }
    }
}
