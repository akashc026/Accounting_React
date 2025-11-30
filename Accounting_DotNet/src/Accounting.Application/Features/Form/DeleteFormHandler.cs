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
    public class DeleteFormHandler : DeleteEntityHandler<AccountingDbContext, Form, Guid, DeleteForm>
    {
        public DeleteFormHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteForm request, CancellationToken cancellationToken)
        {
            var entity = await Entities
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (entity is null)
            {
                throw new KeyNotFoundException($"Form with Id of {request.Id} was not found.");
            }

            await SoftDeleteCustomFormFieldsAsync(request.Id, cancellationToken);
            await SoftDeleteFormSequencesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private async Task SoftDeleteCustomFormFieldsAsync(Guid formId, CancellationToken cancellationToken)
        {
            var fields = await DbContext.CustomFormFields
                .IgnoreQueryFilters()
                .Where(x => x.FormId == formId)
                .ToListAsync(cancellationToken);

            if (fields.Count == 0)
            {
                return;
            }

            var fieldIds = fields.Select(x => x.Id).ToList();
            var fieldValues = await DbContext.CustomFieldValues
                .IgnoreQueryFilters()
                .Where(x => fieldIds.Contains(x.CustomFieldID))
                .ToListAsync(cancellationToken);

            foreach (var field in fields)
            {
                field.IsDeleted = true;
            }

            foreach (var value in fieldValues)
            {
                value.IsDeleted = true;
            }

            DbContext.CustomFormFields.UpdateRange(fields);
            if (fieldValues.Count > 0)
            {
                DbContext.CustomFieldValues.UpdateRange(fieldValues);
            }
        }

        private async Task SoftDeleteFormSequencesAsync(Guid formId, CancellationToken cancellationToken)
        {
            var sequences = await DbContext.FormSequences
                .IgnoreQueryFilters()
                .Where(x => x.FormId == formId)
                .ToListAsync(cancellationToken);

            if (sequences.Count == 0)
            {
                return;
            }

            foreach (var sequence in sequences)
            {
                sequence.IsDeleted = true;
            }

            DbContext.FormSequences.UpdateRange(sequences);
        }
    }
} 
