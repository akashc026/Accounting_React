using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetJournalEntryLineHandler : GetEntityHandler<AccountingDbContext, JournalEntryLine, Guid, GetJournalEntryLine, JournalEntryLineResultDto>
    {
        public GetJournalEntryLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<JournalEntryLineResultDto?> Handle(GetJournalEntryLine request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.AccountNavigation)
                    .Include(x => x.JE)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override JournalEntryLineResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetJournalEntryLine, JournalEntryLine?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<JournalEntryLineResultDto>(entity);
            result.AccountName = entity.AccountNavigation?.Name;
            
            return result;
        }
    }
}
