using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateProductHandler : CreateEntityHandler<AccountingDbContext, Product, Guid, CreateProduct, Guid>
    {
        public CreateProductHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override void OnEntityCreated(CreateProduct request, Product entity)
        {
            base.OnEntityCreated(request, entity);
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateProduct, Product> args)
        {
            return args.Entity.Id;
        }
    }
} 