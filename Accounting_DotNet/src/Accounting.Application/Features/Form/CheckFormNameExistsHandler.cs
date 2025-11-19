using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class CheckFormNameExistsHandler : IRequestHandler<CheckFormNameExists, bool>
    {
        private readonly AccountingDbContext _dbContext;

        public CheckFormNameExistsHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<bool> Handle(CheckFormNameExists request, CancellationToken cancellationToken)
        {
            return await _dbContext.Forms
                .AnyAsync(x => x.FormName == request.FormName && x.TypeOfRecord == request.TypeOfRecord, 
                         cancellationToken);
        }
    }
}
