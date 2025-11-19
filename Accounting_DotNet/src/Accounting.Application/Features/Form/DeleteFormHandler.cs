using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;

namespace Accounting.Application.Features
{
    public class DeleteFormHandler : DeleteEntityHandler<AccountingDbContext, Form, Guid, DeleteForm>
    {
        public DeleteFormHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 