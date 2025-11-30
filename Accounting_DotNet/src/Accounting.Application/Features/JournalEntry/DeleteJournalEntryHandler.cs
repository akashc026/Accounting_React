using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DeleteJournalEntryHandler : DeleteEntityHandler<AccountingDbContext, JournalEntry, Guid, DeleteJournalEntry>
    {
        public DeleteJournalEntryHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteJournalEntry request, CancellationToken cancellationToken)
        {
            var entity = await Entities
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (entity is null)
            {
                throw new KeyNotFoundException($"JournalEntry with Id of {request.Id} was not found.");
            }

            await SoftDeleteLinesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private async Task SoftDeleteLinesAsync(Guid journalEntryId, CancellationToken cancellationToken)
        {
            var lines = await DbContext.JournalEntryLines
                .IgnoreQueryFilters()
                .Where(x => x.JEID == journalEntryId)
                .ToListAsync(cancellationToken);

            foreach (var line in lines)
            {
                line.IsDeleted = true;
            }

            if (lines.Count > 0)
            {
                DbContext.JournalEntryLines.UpdateRange(lines);
            }
        }
    }
}
