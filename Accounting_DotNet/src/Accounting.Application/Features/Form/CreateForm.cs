using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace Accounting.Application.Features
{
    public class CreateForm : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public string FormName { get; set; } = null!;

        public Guid TypeOfRecord { get; set; }

        public string? Prefix { get; set; }

        public string? Reasons { get; set; }

        [JsonPropertyName("isDefault")]
        public bool? IsDefault { get; set; }

        [JsonPropertyName("inactive")]
        public bool? Inactive { get; set; }

        // Use string properties for account fields to handle JSON conversion issues
        [JsonPropertyName("accountReceivable")]
        public string? AccountReceivableString { get; set; }
        [JsonPropertyName("clearing")]
        public string? ClearingString { get; set; }

        [JsonPropertyName("accuredTax")]
        public string? AccuredTaxString { get; set; }

        [JsonPropertyName("accuredAR")]
        public string? AccuredARString { get; set; }

        [JsonPropertyName("discountOnTax")]
        public string? DiscountOnTaxString { get; set; }

        [JsonPropertyName("formType")]
        public string? FormTypeString { get; set; }

        [JsonPropertyName("undepositedFunds")]
        public string? UndepositedFundsString { get; set; }

        [JsonPropertyName("clearingGRNI")]
        public string? ClearingGRNIString { get; set; }

        [JsonPropertyName("clearingSRNI")]
        public string? ClearingSRNIString { get; set; }

        [JsonPropertyName("accountPayable")]
        public string? AccountPayableString { get; set; }

        [JsonPropertyName("clearingVAT")]
        public string? ClearingVATString { get; set; }

        [JsonPropertyName("discountOnTaxDR")]
        public string? DiscountOnTaxDRString { get; set; }

        [JsonPropertyName("discountOnTaxCR")]
        public string? DiscountOnTaxCRString { get; set; }

        // Helper properties to convert strings to Guids
        [JsonIgnore]
        public Guid? AccountReceivable => TryParseGuid(AccountReceivableString);

        [JsonIgnore]
        public Guid? Clearing => TryParseGuid(ClearingString);

        [JsonIgnore]
        public Guid? AccuredTax => TryParseGuid(AccuredTaxString);

        [JsonIgnore]
        public Guid? AccuredAR => TryParseGuid(AccuredARString);

        [JsonIgnore]
        public Guid? DiscountOnTax => TryParseGuid(DiscountOnTaxString);

        [JsonIgnore]
        public Guid? FormType => TryParseGuid(FormTypeString);

        [JsonIgnore]
        public Guid? UndepositedFunds => TryParseGuid(UndepositedFundsString);

        [JsonIgnore]
        public Guid? ClearingGRNI => TryParseGuid(ClearingGRNIString);

        [JsonIgnore]
        public Guid? ClearingSRNI => TryParseGuid(ClearingSRNIString);

        [JsonIgnore]
        public Guid? AccountPayable => TryParseGuid(AccountPayableString);

        [JsonIgnore]
        public Guid? ClearingVAT => TryParseGuid(ClearingVATString);

        [JsonIgnore]
        public Guid? DiscountOnTaxDR => TryParseGuid(DiscountOnTaxDRString);

        [JsonIgnore]
        public Guid? DiscountOnTaxCR => TryParseGuid(DiscountOnTaxCRString);

        private static Guid? TryParseGuid(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            if (Guid.TryParse(value, out var guid) && guid != Guid.Empty)
                return guid;

            return null;
        }
    }
}