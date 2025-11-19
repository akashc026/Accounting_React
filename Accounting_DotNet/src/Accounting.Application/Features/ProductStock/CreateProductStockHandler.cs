using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateProductStockHandler : CreateEntityHandler<AccountingDbContext, ProductStock, Guid, CreateProductStock, Guid>
    {
        public CreateProductStockHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateProductStock, ProductStock> args)
        {
            return args.Entity.Id;
        }
    }
} 