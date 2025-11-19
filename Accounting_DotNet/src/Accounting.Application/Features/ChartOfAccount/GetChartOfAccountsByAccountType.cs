using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetChartOfAccountsByAccountType : IRequest<List<ChartOfAccountResultDto>>
    {
        public Guid AccountTypeId { get; set; }
    }
}
