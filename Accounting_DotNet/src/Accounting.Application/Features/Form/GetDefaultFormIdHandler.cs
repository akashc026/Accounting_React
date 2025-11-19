using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetDefaultFormIdHandler : IRequestHandler<GetDefaultFormId, Guid?>
    {
        private readonly AccountingDbContext _dbContext;

        public GetDefaultFormIdHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid?> Handle(GetDefaultFormId request, CancellationToken cancellationToken)
        {
            var form = await _dbContext.Forms
                .Where(x => x.TypeOfRecord == request.TypeOfRecord && x.IsDefault == true)
                .FirstOrDefaultAsync(cancellationToken);

            return form?.Id;
        }
    }
}
