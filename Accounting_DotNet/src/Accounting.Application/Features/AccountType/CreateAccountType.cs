using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateAccountType : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public string Name { get; set; } = null!;
    }
} 
