using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;

namespace Accounting.Application.Features
{
    public class DeleteCustomFormFieldHandler : DeleteEntityHandler<AccountingDbContext, CustomFormField, Guid, DeleteCustomFormField>
    {
        public DeleteCustomFormFieldHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 