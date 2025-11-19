using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetChartOfAccountsByParentNumber : IRequest<List<ChartOfAccountResultDto>>
    {
        public string ParentNumber { get; set; } = null!;
    }
} 