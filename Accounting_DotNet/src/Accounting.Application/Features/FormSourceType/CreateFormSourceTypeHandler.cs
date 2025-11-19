using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateFormSourceTypeHandler : CreateEntityHandler<AccountingDbContext, FormSourceType, Guid, CreateFormSourceType, Guid>
    {
        public CreateFormSourceTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateFormSourceType, FormSourceType> args)
        {
            return args.Entity.Id;
        }
    }
}
