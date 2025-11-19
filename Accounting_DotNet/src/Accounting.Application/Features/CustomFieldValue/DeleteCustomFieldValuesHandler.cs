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
    public class DeleteCustomFieldValuesHandler : IRequestHandler<DeleteCustomFieldValues, int>
    {
        private readonly AccountingDbContext _dbContext;

        public DeleteCustomFieldValuesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(DeleteCustomFieldValues request, CancellationToken cancellationToken)
        {
            if (request.Ids == null || !request.Ids.Any())
            {
                return 0;
            }

            var valuesToDelete = await _dbContext.CustomFieldValues
                .Where(value => request.Ids.Contains(value.ID))
                .ToListAsync(cancellationToken);

            if (!valuesToDelete.Any())
            {
                return 0;
            }

            _dbContext.CustomFieldValues.RemoveRange(valuesToDelete);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return valuesToDelete.Count;
        }
    }
}
