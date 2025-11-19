using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class UpdateChartOfAccountHandler : IRequestHandler<UpdateChartOfAccount, Guid>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateChartOfAccountHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateChartOfAccount request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.ChartOfAccounts.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            
            if (entity == null)
                throw new KeyNotFoundException($"ChartOfAccount with ID {request.Id} not found.");

            // Only update fields that have values
            if (!string.IsNullOrEmpty(request.Name))
                entity.Name = request.Name;
                
            if (!string.IsNullOrEmpty(request.AccountNumber))
                entity.AccountNumber = request.AccountNumber;
                
            if (request.AccountType.HasValue)
                entity.AccountType = request.AccountType.Value;
                
            if (request.OpeningBalance.HasValue)
                entity.OpeningBalance = request.OpeningBalance.Value;
                
            if (request.Inactive.HasValue)
                entity.Inactive = request.Inactive.Value;
                
            if (request.Notes != null)
                entity.Notes = request.Notes;
                
            if (!string.IsNullOrEmpty(request.ParentNumber))
                entity.ParentNumber = request.ParentNumber;
                
            if (request.IsParent.HasValue)
                entity.IsParent = request.IsParent.Value;
                
            if (request.Parent.HasValue)
                entity.Parent = request.Parent.Value;
                
            if (request.RunningBalance.HasValue)
                entity.RunningBalance = request.RunningBalance.Value;

            await _dbContext.SaveChangesAsync(cancellationToken);
            
            return entity.Id;
        }
    }
}
