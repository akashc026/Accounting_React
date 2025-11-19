using MediatR;

namespace Accounting.Application.Features
{
    public class GetCustomFormFieldsByFormId : IRequest<List<CustomFormFieldResultDto>>
    {
        public Guid FormId { get; set; }
    }
} 