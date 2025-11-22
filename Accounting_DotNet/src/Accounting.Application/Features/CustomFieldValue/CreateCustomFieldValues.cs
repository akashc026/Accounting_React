using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateCustomFieldValues : IRequest<List<Guid>>
    {
        public string? CreatedBy { get; set; }

        public List<CustomFieldValueCreateDto> Values { get; set; } = new();
    }

    public class CustomFieldValueCreateDto
    {
        public Guid TypeOfRecord { get; set; }

        public string ValueText { get; set; } = null!;

        public Guid CustomFieldID { get; set; }

        public string? RecordID { get; set; }
    }
}
