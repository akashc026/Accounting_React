using ExcentOne.MediatR.EntityFrameworkCore.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetAccountTypeByName : IDbQuery<AccountTypeResultDto?>
    {
        public string Name { get; set; } = null!;
    }
} 
