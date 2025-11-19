using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetItemTypeHandler : GetEntityHandler<AccountingDbContext, ItemType, Guid, GetItemType, ItemTypeResultDto>
    {
        public GetItemTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override ItemTypeResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetItemType, ItemType?> args)
        {
            return Mapper.Map<ItemTypeResultDto>(args.Result!);
        }
    }
} 