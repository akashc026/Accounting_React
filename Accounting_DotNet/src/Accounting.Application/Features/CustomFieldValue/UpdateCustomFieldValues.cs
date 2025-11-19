using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateCustomFieldValues : IRequest<int>
    {
        public List<CustomFieldValueUpdateDto> Values { get; set; } = new();
    }

    public class CustomFieldValueUpdateDto
    {
        public Guid ID { get; set; }

        public Guid? TypeOfRecord { get; set; }

        public string? ValueText { get; set; }

        public Guid? CustomFieldID { get; set; }

        public string? RecordID { get; set; }
    }
}
