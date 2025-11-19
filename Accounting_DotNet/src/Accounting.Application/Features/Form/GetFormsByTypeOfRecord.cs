using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetFormsByTypeOfRecord : IRequest<List<FormResultDto>>
    {
        public Guid TypeOfRecord { get; set; }
    }
} 