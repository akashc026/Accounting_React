using ExcentOne.Application.Features.Commands;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DeleteCustomFieldValue : IDeleteEntity<Guid>, IRequest
    {
        public Guid Id { get; set; }
    }
} 