using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DeleteCustomer : IDeleteEntity<Guid>
    {
        public Guid Id { get; set; }
    }
}
