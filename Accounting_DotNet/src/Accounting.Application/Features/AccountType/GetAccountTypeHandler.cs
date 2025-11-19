using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetAccountTypeHandler : GetEntityHandler<AccountingDbContext, AccountType, Guid, GetAccountType, AccountTypeResultDto>
    {
        public GetAccountTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<AccountTypeResultDto?> Handle(GetAccountType request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override AccountTypeResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetAccountType, AccountType?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<AccountTypeResultDto>(entity);
            
            return result;
        }
    }
} 
