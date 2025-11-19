using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class DeleteVendorCreditLineHandler : DeleteEntityHandler<AccountingDbContext, VendorCreditLine, Guid, DeleteVendorCreditLine>
    {
        public DeleteVendorCreditLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
