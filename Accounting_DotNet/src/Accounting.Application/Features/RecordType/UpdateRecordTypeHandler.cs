using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateRecordTypeHandler : UpdateEntityHandler<AccountingDbContext, RecordType, Guid, UpdateRecordType, Guid>
    {
        public UpdateRecordTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateRecordType, RecordType> args)
        {
            return args.Entity.Id;
        }
    }
} 