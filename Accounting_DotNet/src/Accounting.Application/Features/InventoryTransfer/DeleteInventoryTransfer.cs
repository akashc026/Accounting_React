using ExcentOne.Application.Features.Commands;
using System;

namespace Accounting.Application.Features
{
    public class DeleteInventoryTransfer : IDeleteEntity<Guid>
    {
        public Guid Id { get; set; }
    }
}

