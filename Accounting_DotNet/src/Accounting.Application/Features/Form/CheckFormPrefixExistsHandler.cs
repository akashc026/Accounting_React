using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class CheckFormPrefixExistsHandler : IRequestHandler<CheckFormPrefixExists, bool>
    {
        private readonly AccountingDbContext _dbContext;

        public CheckFormPrefixExistsHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<bool> Handle(CheckFormPrefixExists request, CancellationToken cancellationToken)
        {
            return await _dbContext.Forms
                .AnyAsync(x => x.Prefix == request.Prefix && x.TypeOfRecord == request.TypeOfRecord, 
                         cancellationToken);
        }
    }
}
