using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    namespace Accounting.Application.Features
    {
        public class FormResultDto
        {
            public Guid Id { get; set; }

            public string FormName { get; set; } = null!;

        public Guid TypeOfRecord { get; set; }

        public string? Prefix { get; set; }

        public string? Reasons { get; set; }

        public bool? IsDefault { get; set; }

        public bool? Inactive { get; set; }

        public Guid? AccountReceivable { get; set; }

        public Guid? Clearing { get; set; }

        public Guid? AccuredTax { get; set; }
            public Guid? AccuredAR { get; set; }

            public Guid? DiscountOnTax { get; set; }

            public Guid? FormType { get; set; }

            public Guid? UndepositedFunds { get; set; }

            public Guid? ClearingGRNI { get; set; }

            public Guid? ClearingSRNI { get; set; }

            public Guid? AccountPayable { get; set; }

            public Guid? ClearingVAT { get; set; }

            public Guid? DiscountOnTaxDR { get; set; }

            public Guid? DiscountOnTaxCR { get; set; }

            public string TypeOfRecordName { get; set; } = null!;

            public string? AccountReceivableName { get; set; }

            public string? ClearingName { get; set; }

            public string? AccuredTaxName { get; set; }

            public string? AccuredARName { get; set; }

            public string? DiscountOnTaxName { get; set; }

            public string? FormTypeName { get; set; }

            public string? UndepositedFundsName { get; set; }

            public string? ClearingGRNIName { get; set; }

            public string? ClearingSRNIName { get; set; }

            public string? AccountPayableName { get; set; }

            public string? ClearingVATName { get; set; }

            public string? DiscountOnTaxDRName { get; set; }

            public string? DiscountOnTaxCRName { get; set; }
        }
    }