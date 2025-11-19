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
    public class GetJournalEntryHandler : GetEntityHandler<AccountingDbContext, JournalEntry, Guid, GetJournalEntry, JournalEntryResultDto>
    {
        public GetJournalEntryHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<JournalEntryResultDto?> Handle(GetJournalEntry request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.FormNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override JournalEntryResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetJournalEntry, JournalEntry?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<JournalEntryResultDto>(entity);
            result.FormName = entity.FormNavigation?.FormName;
            
            return result;
        }
    }
}
