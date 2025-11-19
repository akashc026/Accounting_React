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
    public class GetLocationHandler : GetEntityHandler<AccountingDbContext, Location, Guid, GetLocation, LocationResultDto>
    {
        public GetLocationHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override LocationResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetLocation, Location?> args)
        {
            return Mapper.Map<LocationResultDto>(args.Result!);
        }
    }
}
