using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Accounting.Application.Features
{
    public class GetAccountTypeByNameHandler : DbQueryHandler<AccountingDbContext, AccountType, GetAccountTypeByName, AccountType?, AccountTypeResultDto?>
    {
        protected readonly IMapper Mapper;

        public GetAccountTypeByNameHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext)
        {
            Mapper = mapper;
        }

        public override async Task<AccountTypeResultDto?> Handle(GetAccountTypeByName request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .FirstOrDefaultAsync(x => x.Name.ToLower() == request.Name.ToLower(), cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override Expression<Func<AccountType, bool>> ComposeFilter(Expression<Func<AccountType, bool>> predicate, GetAccountTypeByName request)
        {
            return predicate.And(x => x.Name.ToLower() == request.Name.ToLower());
        }

        protected override AccountTypeResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetAccountTypeByName, AccountType?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<AccountTypeResultDto>(entity);
            
            return result;
        }
    }
} 
