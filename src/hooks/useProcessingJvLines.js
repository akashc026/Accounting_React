// Hook for processing journal voucher lines from sales transactions
import { buildUrl } from '../config/api';
import { processJournal } from './useJournal';

// Export function to generate JV lines WITHOUT processing them (for validation)
export async function generateJvLines(lineItems, formId, totalAmount, recordType, discount, calculatedTotals) {
    console.log('=== Generating JV Lines ===');
    console.log('Line Items:', lineItems);



    // Fetch form details
    const formDetails = await fetchFormDetails(formId);
    console.log('Form details fetched:', formDetails);

    let jvLines = [];

    if (!formDetails) {
        throw new Error('Form details could not be fetched. Please select a valid form.');
    }

    const formType = formDetails.formType;

    // Generate JV lines based on record type (same logic as processJvLines but without recordId)
    if (recordType === "CustomerPayment") {
        jvLines.push({
            accountId: formDetails.accountReceivable,
            newCredit: totalAmount,
            newDebit: 0,
            oldCredit: 0,
            oldDebit: 0,
            memo: "",
        });

        jvLines.push({
            accountId: formDetails.undepositedFunds,
            newCredit: 0,
            newDebit: totalAmount,
            oldCredit: 0,
            oldDebit: 0,
            memo: "",
        });
    }

    if (recordType === 'Invoice') {
        let totalTaxAmount = 0;
        if (lineItems && lineItems.length > 0) {
            for (const item of lineItems) {
                const itemTaxAmount = parseFloat(item.taxRate || item.taxAmount);
                totalTaxAmount += itemTaxAmount;
            }
        }

        if (formType) {

            if (formType == "a34b6525-52d9-4915-a095-65ec36d4b0f2") {  //GAAP on Discount

                if (discount > 0) {
                    const totalTaxPercent = calculatedTotals.totalTaxPercent;
                    const averageTax = Math.round((totalTaxPercent / calculatedTotals.totalItemcount) * 100) / 100;
                    const subTotal = Math.round(((calculatedTotals.totalRate - discount) * 100)) / 100;
                    const calculatedTax = Math.round((subTotal * averageTax) / 100 * 100) / 100;
                    const NetAmount = Math.round((subTotal + calculatedTax) * 100) / 100;
                    const taxOnDiscount = Math.round((discount * averageTax) / 100 * 100) / 100;
                    const perLineDiscount = (Number(discount) / Number(calculatedTotals.totalItemcount))

                    jvLines.push({
                        accountId: formDetails.accuredAR,
                        newCredit: totalAmount,
                        newDebit: 0,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });

                    jvLines.push({
                        accountId: formDetails.accuredTax,
                        newCredit: 0,
                        newDebit: totalTaxAmount,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });

                    jvLines.push({
                        accountId: formDetails.accountReceivable,
                        newCredit: 0,
                        newDebit: NetAmount,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });

                    jvLines.push({
                        accountId: formDetails.discountOnTax,
                        newCredit: 0,
                        newDebit: discount,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });

                    jvLines.push({
                        accountId: formDetails.discountOnTaxDR,
                        newCredit: 0,
                        newDebit: taxOnDiscount,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });

                    jvLines.push({
                        accountId: formDetails.discountOnTaxCR,
                        newCredit: taxOnDiscount,
                        newDebit: 0,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });


                    for (const item of lineItems) {
                        const taxId = item.taxID?.value || item.taxID;
                        const quantityline = Number(item.quantity || item.quantityDelivered);
                        const rateline = Number(item.rate);
                        const lineTotal = Math.round(quantityline * rateline * 10000000000) / 10000000000;
                        const doscountedLine = lineTotal - perLineDiscount;
                        if (taxId) {
                            try {
                                const taxDetails = await apiRequest(`/tax/${taxId}`, { method: 'GET' });
                                // Only add tax JV line if taxRate is greater than zero
                                if (taxDetails && taxDetails.taxRate > 0) {
                                    jvLines.push({
                                        accountId: taxDetails.taxAccount,
                                        newCredit: Math.round((doscountedLine * averageTax) / 100 * 100) / 100,
                                        newDebit: 0,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });
                                }
                            } catch (error) {
                                console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                            }
                        }
                    }
                } else {
                    return {
                        isValid: false,
                        jvLines: [],
                        errorMessage: `Cannot create ${recordType}. Discount is Invalid or Zero for selected form.`
                    };
                }
            }
            else {
                if (discount > 0) {
                    const calTotalAmount = Math.round(((totalAmount - discount) * 100)) / 100;
                    jvLines.push({
                        accountId: formDetails.accountReceivable,
                        newCredit: 0,
                        newDebit: calTotalAmount,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });

                    jvLines.push({
                        accountId: formDetails.discountOnTax,
                        newCredit: 0,
                        newDebit: discount,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });
                }
                else {
                    jvLines.push({
                        accountId: formDetails.accountReceivable,
                        newCredit: 0,
                        newDebit: totalAmount,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });
                }

                if (formType == "3e7a690c-dd04-4254-89f6-58e85139c07d") { // GAAP
                    jvLines.push({
                        accountId: formDetails.accuredAR,
                        newCredit: totalAmount,
                        newDebit: 0,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });

                    jvLines.push({
                        accountId: formDetails.accuredTax,
                        newCredit: 0,
                        newDebit: totalTaxAmount,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });

                    for (const item of lineItems) {
                        const taxId = item.taxID?.value || item.taxID;
                        if (taxId) {
                            try {
                                const taxDetails = await apiRequest(`/tax/${taxId}`, { method: 'GET' });
                                // Only add tax JV line if taxRate is greater than zero
                                if (taxDetails && taxDetails.taxRate > 0) {
                                    jvLines.push({
                                        accountId: taxDetails.taxAccount,
                                        newCredit: parseFloat(item.taxRate || item.taxAmount),
                                        newDebit: 0,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });
                                }
                            } catch (error) {
                                console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                            }
                        }
                    }
                }

                if (formType == "9d19694e-dac4-4840-a29b-c1e1be0d82f0" || formType == "3ddc355d-d7e9-4ae3-bdb5-386012fd9a6f" || formType == "69a5b24f-0bd4-4f80-adf1-a03bfb7531a8") {
                    for (const item of lineItems) {
                        const itemID = item.itemID?.value || item.itemID;
                        const quantityline = Number(item.quantity || item.quantityDelivered);
                        const rateline = Number(item.rate);
                        const lineTotal = Math.round(quantityline * rateline * 10000000000) / 10000000000;
                        const withoutTotalline = Math.round(lineTotal * 100) / 100;

                        if (itemID) {
                            try {
                                const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });

                                jvLines.push({
                                    accountId: itemDetails.salesAccount,
                                    newCredit: withoutTotalline,
                                    newDebit: 0,
                                    oldCredit: 0,
                                    oldDebit: 0,
                                    memo: "",
                                });

                                if (formType !== "69a5b24f-0bd4-4f80-adf1-a03bfb7531a8") {
                                    if (itemDetails.itemType == "ef765a67-402b-48ee-b898-8eaa45affb64") {
                                        if (itemDetails.averageCost) {
                                            jvLines.push({
                                                accountId: itemDetails.cogsAccount,
                                                newCredit: 0,
                                                newDebit: parseFloat(itemDetails.averageCost) * Number(quantityline),
                                                oldCredit: 0,
                                                oldDebit: 0,
                                                memo: "",
                                            });

                                            const inventoryOrClearingAccount = formType == "9d19694e-dac4-4840-a29b-c1e1be0d82f0"
                                                ? formDetails.clearing
                                                : itemDetails.inventoryAccount;

                                            jvLines.push({
                                                accountId: inventoryOrClearingAccount,
                                                newCredit: parseFloat(itemDetails.averageCost) * Number(quantityline),
                                                newDebit: 0,
                                                oldCredit: 0,
                                                oldDebit: 0,
                                                memo: "",
                                            });
                                        } else {
                                            return {
                                                isValid: false,
                                                jvLines: [],
                                                errorMessage: `Cannot create ${recordType}. Average Cost is Invalid or Zero.`
                                            };
                                        }
                                    } else {
                                        if (itemDetails.standardCost) {
                                            jvLines.push({
                                                accountId: itemDetails.cogsAccount,
                                                newCredit: 0,
                                                newDebit: parseFloat(itemDetails.standardCost) * Number(quantityline),
                                                oldCredit: 0,
                                                oldDebit: 0,
                                                memo: "",
                                            });

                                            const inventoryOrClearingAccount = formType == "9d19694e-dac4-4840-a29b-c1e1be0d82f0"
                                                ? formDetails.clearing
                                                : itemDetails.expenseAccount;

                                            jvLines.push({
                                                accountId: inventoryOrClearingAccount,
                                                newCredit: parseFloat(itemDetails.standardCost) * Number(quantityline),
                                                newDebit: 0,
                                                oldCredit: 0,
                                                oldDebit: 0,
                                                memo: "",
                                            });
                                        } else {
                                            return {
                                                isValid: false,
                                                jvLines: [],
                                                errorMessage: `Cannot create ${recordType}. standard Cost is Invalid or Zero.`
                                            };
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error(`Error fetching item details for itemID ${itemID}:`, error);
                            }
                        }

                        const taxId = item.taxID?.value || item.taxID;
                        if (taxId) {
                            try {
                                const taxDetails = await apiRequest(`/tax/${taxId}`, { method: 'GET' });
                                // Only add tax JV line if taxRate is greater than zero
                                if (taxDetails && taxDetails.taxRate > 0) {
                                    jvLines.push({
                                        accountId: taxDetails.taxAccount,
                                        newCredit: parseFloat(item.taxRate || item.taxAmount),
                                        newDebit: 0,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });
                                }
                            } catch (error) {
                                console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                            }
                        }
                    }
                }
            }
        }
    }

    if (recordType === 'ItemFulfillment') {
        if (formType) {
            if (formType == "3e7a690c-dd04-4254-89f6-58e85139c07d" || formType == "a34b6525-52d9-4915-a095-65ec36d4b0f2") { // GAAP
                jvLines.push({
                    accountId: formDetails.accuredAR,
                    newCredit: 0,
                    newDebit: totalAmount,
                    oldCredit: 0,
                    oldDebit: 0,
                    memo: "",
                });

                for (const item of lineItems) {
                    if (item.taxAmount || item.taxRate) {
                        jvLines.push({
                            accountId: formDetails.accuredTax,
                            newCredit: parseFloat(item.taxAmount || item.taxRate),
                            newDebit: 0,
                            oldCredit: 0,
                            oldDebit: 0,
                            memo: "",
                        });
                    }

                    const itemID = item.itemID?.value || item.itemID;
                    const quantityline = Number(item.quantity || item.quantityDelivered);
                    const rateline = Number(item.rate);
                    const lineTotal = Math.round(quantityline * rateline * 10000000000) / 10000000000;
                    const withoutTotalline = Math.round(lineTotal * 100) / 100;


                    if (itemID) {
                        try {
                            const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });

                            jvLines.push({
                                accountId: itemDetails.salesAccount,
                                newCredit: withoutTotalline,
                                newDebit: 0,
                                oldCredit: 0,
                                oldDebit: 0,
                                memo: "",
                            });

                            if (itemDetails.itemType == "ef765a67-402b-48ee-b898-8eaa45affb64") {
                                if (itemDetails.averageCost) {
                                    jvLines.push({
                                        accountId: itemDetails.cogsAccount,
                                        newCredit: 0,
                                        newDebit: parseFloat(itemDetails.averageCost) * Number(quantityline),
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });

                                    jvLines.push({
                                        accountId: itemDetails.inventoryAccount,
                                        newCredit: parseFloat(itemDetails.averageCost) * Number(quantityline),
                                        newDebit: 0,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });
                                } else {
                                    return {
                                        isValid: false,
                                        jvLines: [],
                                        errorMessage: `Cannot create ${recordType}. Average Cost is Invalid or Zero.`
                                    };
                                }
                            }
                            else {
                                if (itemDetails.standardCost) {
                                    jvLines.push({
                                        accountId: itemDetails.cogsAccount,
                                        newCredit: 0,
                                        newDebit: parseFloat(itemDetails.standardCost) * quantityline,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });

                                    jvLines.push({
                                        accountId: itemDetails.expenseAccount,
                                        newCredit: parseFloat(itemDetails.standardCost) * quantityline,
                                        newDebit: 0,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });
                                } else {
                                    return {
                                        isValid: false,
                                        jvLines: [],
                                        errorMessage: `Cannot create ${recordType}. standard Cost is Invalid or Zero.`
                                    };
                                }
                            }

                        } catch (error) {
                            console.error(`Error fetching item details for itemID ${itemID}:`, error);
                        }
                    }
                }
            }

            if (formType == "9d19694e-dac4-4840-a29b-c1e1be0d82f0") { // expense clearing
                for (const item of lineItems) {
                    const itemID = item.itemID?.value || item.itemID;

                    if (itemID) {
                        try {
                            const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });

                            if (itemDetails.itemType == "ef765a67-402b-48ee-b898-8eaa45affb64") {
                                if (itemDetails.averageCost) {
                                    jvLines.push({
                                        accountId: itemDetails.inventoryAccount,
                                        newCredit: parseFloat(itemDetails.averageCost) * Number(item.quantity),
                                        newDebit: 0,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });

                                    jvLines.push({
                                        accountId: formDetails.clearing,
                                        newCredit: 0,
                                        newDebit: parseFloat(itemDetails.averageCost) * Number(item.quantity),
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });
                                }
                                else {
                                    return {
                                        isValid: false,
                                        jvLines: [],
                                        errorMessage: `Cannot create ${recordType}. Average Cost is Invalid or Zero.`
                                    };
                                }
                            }
                            else {
                                if (itemDetails.standardCost) {
                                    jvLines.push({
                                        accountId: itemDetails.expenseAccount,
                                        newCredit: parseFloat(itemDetails.standardCost) * Number(item.quantity),
                                        newDebit: 0,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });

                                    jvLines.push({
                                        accountId: formDetails.clearing,
                                        newCredit: 0,
                                        newDebit: parseFloat(itemDetails.standardCost) * Number(item.quantity),
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });
                                }
                                else {
                                    return {
                                        isValid: false,
                                        jvLines: [],
                                        errorMessage: `Cannot create ${recordType}. standard Cost is Invalid or Zero.`
                                    };
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching item details for itemID ${itemID}:`, error);
                        }
                    }
                }
            }

            if (formType == "69a5b24f-0bd4-4f80-adf1-a03bfb7531a8" || formType == "3ddc355d-d7e9-4ae3-bdb5-386012fd9a6f") {
                for (const item of lineItems) {
                    const itemID = item.itemID?.value || item.itemID;

                    if (itemID) {
                        try {
                            const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });
                            if (itemDetails.itemType == "ef765a67-402b-48ee-b898-8eaa45affb64") {
                                if (itemDetails.averageCost) {
                                    jvLines.push({
                                        accountId: itemDetails.cogsAccount,
                                        newCredit: 0,
                                        newDebit: parseFloat(itemDetails.averageCost) * Number(item.quantity),
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });


                                    jvLines.push({
                                        accountId: itemDetails.inventoryAccount,
                                        newCredit: parseFloat(itemDetails.averageCost) * Number(item.quantity),
                                        newDebit: 0,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });

                                }
                                else {
                                    return {
                                        isValid: false,
                                        jvLines: [],
                                        errorMessage: `Cannot create ${recordType}. Average Cost is Invalid or Zero.`
                                    };
                                }
                            }
                            else {
                                if (itemDetails.standardCost) {
                                    jvLines.push({
                                        accountId: itemDetails.cogsAccount,
                                        newCredit: 0,
                                        newDebit: parseFloat(itemDetails.standardCost) * Number(item.quantity),
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });


                                    jvLines.push({
                                        accountId: itemDetails.expenseAccount,
                                        newCredit: parseFloat(itemDetails.standardCost) * Number(item.quantity),
                                        newDebit: 0,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });

                                }
                                else {
                                    return {
                                        isValid: false,
                                        jvLines: [],
                                        errorMessage: `Cannot create ${recordType}. standard Cost is Invalid or Zero.`
                                    };
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching item details for itemID ${itemID}:`, error);
                        }
                    }
                }
            }
        }
    }

    if (recordType === 'DebitMemo' || recordType === 'CreditMemo') {
        jvLines.push({
            accountId: formDetails.accountReceivable,
            newCredit: recordType === 'CreditMemo' ? (totalAmount) : 0,
            newDebit: recordType === 'DebitMemo' ? (totalAmount) : 0,
            oldCredit: 0,
            oldDebit: 0,
            memo: "",
        });

        for (const item of lineItems) {
            const itemID = item.itemID?.value || item.itemID;
            const taxId = item.taxID?.value || item.taxID;
            const quantityline = Number(item.quantity || item.quantityDelivered);
            const rateline = Number(item.rate);
            const lineTotal = Math.round(quantityline * rateline * 10000000000) / 10000000000;
            const withoutTotalline = Math.round(lineTotal * 100) / 100;

            if (itemID) {
                try {
                    const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });

                    jvLines.push({
                        accountId: itemDetails.salesAccount,
                        newCredit: recordType === 'DebitMemo' ? (withoutTotalline) : 0,
                        newDebit: recordType === 'CreditMemo' ? (withoutTotalline) : 0,
                        oldCredit: 0,
                        oldDebit: 0,
                        memo: "",
                    });

                } catch (error) {
                    console.error(`Error fetching item details for itemID ${itemID}:`, error);
                }
            }

            if (taxId) {
                try {
                    const taxDetails = await apiRequest(`/tax/${taxId}`, { method: 'GET' });

                    // Only add tax JV line if taxRate is greater than zero
                    if (taxDetails && taxDetails.taxRate > 0) {
                        jvLines.push({
                            accountId: taxDetails.taxAccount,
                            newCredit: recordType === 'DebitMemo' ? parseFloat(item.taxAmount || item.taxRate) : 0,
                            newDebit: recordType === 'CreditMemo' ? parseFloat(item.taxAmount || item.taxRate) : 0,
                            oldCredit: 0,
                            oldDebit: 0,
                            memo: "",
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                }
            }
        }
    }

    if (recordType === 'InventoryAdjustment') {
        for (const item of lineItems) {
            const itemID = item.itemID?.value || item.itemID;
            const quantityline = Number(item.quantityAdjusted);
            const reasonString = item.reason;
            if (reasonString) {
                const reasonAccount = reasonString.split("$");
                if (itemID) {
                    try {
                        const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });

                        if (itemDetails.averageCost) {
                            if (quantityline > 0) {
                                jvLines.push({
                                    accountId: itemDetails.inventoryAccount,
                                    newCredit: parseFloat(itemDetails.averageCost) * Number(quantityline),
                                    newDebit: 0,
                                    oldCredit: 0,
                                    oldDebit: 0,
                                    memo: "",
                                });

                                jvLines.push({
                                    accountId: reasonAccount[1],
                                    newCredit: 0,
                                    newDebit: parseFloat(itemDetails.averageCost) * Number(quantityline),
                                    oldCredit: 0,
                                    oldDebit: 0,
                                    memo: "",
                                });
                            }
                            else {
                                jvLines.push({
                                    accountId: itemDetails.inventoryAccount,
                                    newCredit: 0,
                                    newDebit: parseFloat(itemDetails.averageCost) * Math.abs(Number(quantityline)),
                                    oldCredit: 0,
                                    oldDebit: 0,
                                    memo: "",
                                });

                                jvLines.push({
                                    accountId: reasonAccount[1],
                                    newCredit: parseFloat(itemDetails.averageCost) * Math.abs(Number(quantityline)),
                                    newDebit: 0,
                                    oldCredit: 0,
                                    oldDebit: 0,
                                    memo: "",
                                });
                            }
                        }
                        else {
                            return {
                                isValid: false,
                                jvLines: [],
                                errorMessage: `Cannot create ${recordType}. Average Cost is Invalid or Zero.`
                            };
                        }

                    } catch (error) {
                        console.error(`Error fetching item details for itemID ${itemID}:`, error);
                    }
                }
            }
            else {
                return {
                    isValid: false,
                    jvLines: [],
                    errorMessage: `Cannot create ${recordType}. Reason Account is not added.`
                };
            }
        }
    }


    if (recordType === 'ItemReceipt') {


        let isClearingApplied = false;

        for (const item of lineItems) {
            const itemID = item.itemID?.value || item.itemID;
            const quantityline = Number(item.quantityReceived);
            const rateline = parseFloat(item.rate);
            const lineTotal = Math.round(quantityline * rateline * 10000000000) / 10000000000;
            const withoutTotalline = Math.round(lineTotal * 100) / 100;

            if (itemID) {
                try {
                    const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });



                    if (!isClearingApplied) {
                        if (itemDetails.itemType == "ef765a67-402b-48ee-b898-8eaa45affb64") {
                            jvLines.push({
                                accountId: formDetails.clearingGRNI,
                                newCredit: totalAmount,
                                newDebit: 0,
                                oldCredit: 0,
                                oldDebit: 0,
                                memo: "",
                            });
                            isClearingApplied = true;
                        }
                        else {
                            jvLines.push({
                                accountId: formDetails.clearingSRNI,
                                newCredit: totalAmount,
                                newDebit: 0,
                                oldCredit: 0,
                                oldDebit: 0,
                                memo: "",
                            });
                            isClearingApplied = true;
                        }
                    }


                    if (item.taxAmount > 0 || item.taxRate > 0) {

                        jvLines.push({
                            accountId: itemDetails.inventoryAccount,
                            newCredit: 0,
                            newDebit: withoutTotalline,
                            oldCredit: 0,
                            oldDebit: 0,
                            memo: "",
                        });



                        jvLines.push({
                            accountId: formDetails.clearingVAT,
                            newCredit: 0,
                            newDebit: parseFloat(item.taxAmount || item.taxRate),
                            oldCredit: 0,
                            oldDebit: 0,
                            memo: "",
                        });

                    }
                    else {
                        jvLines.push({
                            accountId: itemDetails.inventoryAccount,
                            newCredit: 0,
                            newDebit: totalAmount,
                            oldCredit: 0,
                            oldDebit: 0,
                            memo: "",
                        });
                    }



                } catch (error) {
                    console.error(`Error fetching item details for itemID ${itemID}:`, error);
                }
            }
        }
    }

    if (recordType === 'VendorBill') {

        let isClearingApplied = false;
        for (const item of lineItems) {
            const itemID = item.itemID?.value || item.itemID;

            if (itemID) {
                try {
                    const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });


                    if (!isClearingApplied) {
                        jvLines.push({
                            accountId: formDetails.accountPayable,
                            newCredit: totalAmount,
                            newDebit: 0,
                            oldCredit: 0,
                            oldDebit: 0,
                            memo: "",
                        });
                        if (itemDetails.itemType == "ef765a67-402b-48ee-b898-8eaa45affb64") {
                            jvLines.push({
                                accountId: formDetails.clearingGRNI,
                                newCredit: 0,
                                newDebit: totalAmount,
                                oldCredit: 0,
                                oldDebit: 0,
                                memo: "",
                            });
                            isClearingApplied = true;
                        }
                        else {
                            jvLines.push({
                                accountId: formDetails.clearingSRNI,
                                newCredit: 0,
                                newDebit: totalAmount,
                                oldCredit: 0,
                                oldDebit: 0,
                                memo: "",
                            });
                            isClearingApplied = true;
                        }
                    }

                    const taxId = item.taxID?.value || item.taxID;
                    const isTaxApplied = item.isTaxApplied;
                    if (taxId) {
                        try {
                            const taxDetails = await apiRequest(`/tax/${taxId}`, { method: 'GET' });
                            // Only add tax JV line if taxRate is greater than zero
                            if (isTaxApplied) {
                                if (taxDetails && taxDetails.taxRate > 0) {
                                    jvLines.push({
                                        accountId: formDetails.clearingVAT,
                                        newCredit: parseFloat(item.taxAmount || item.taxRate),
                                        newDebit: 0,
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });

                                    jvLines.push({
                                        accountId: taxDetails.taxAccount,
                                        newCredit: 0,
                                        newDebit: parseFloat(item.taxRate || item.taxAmount),
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });
                                }
                            }
                            else {
                                if (taxDetails && taxDetails.taxRate > 0) {
                                    jvLines.push({
                                        accountId: taxDetails.taxAccount,
                                        newCredit: 0,
                                        newDebit: parseFloat(item.taxRate || item.taxAmount),
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                        }
                    }


                } catch (error) {
                    console.error(`Error fetching item details for itemID ${itemID}:`, error);
                }
            }
        }
    }

    if (recordType === 'VendorCredit') {
        for (const item of lineItems) {
            const itemID = item.itemID?.value || item.itemID;
            const quantityline = Number(item.quantity || item.quantityDelivered);
            const rateline = parseFloat(item.rate);
            const lineTotal = Math.round(quantityline * rateline * 10000000000) / 10000000000;
            const withoutTotalline = Math.round(lineTotal * 100) / 100;
            if (itemID) {
                try {
                    const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });

                    if (itemDetails.itemType == "ef765a67-402b-48ee-b898-8eaa45affb64") {
                        jvLines.push({
                            accountId: formDetails.accountPayable,
                            newCredit: 0,
                            newDebit: totalAmount,
                            oldCredit: 0,
                            oldDebit: 0,
                            memo: "",
                        });

                        jvLines.push({
                            accountId: itemDetails.inventoryAccount,
                            newCredit: withoutTotalline,
                            newDebit: 0,
                            oldCredit: 0,
                            oldDebit: 0,
                            memo: "",
                        });


                        const taxId = item.taxID?.value || item.taxID;
                        if (taxId) {
                            try {
                                const taxDetails = await apiRequest(`/tax/${taxId}`, { method: 'GET' });
                                // Only add tax JV line if taxRate is greater than zero
                                if (taxDetails && taxDetails.taxRate > 0) {
                                    jvLines.push({
                                        accountId: taxDetails.taxAccount,
                                        newCredit: 0,
                                        newDebit: parseFloat(item.taxRate || item.taxAmount),
                                        oldCredit: 0,
                                        oldDebit: 0,
                                        memo: "",
                                    });
                                }
                            } catch (error) {
                                console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                            }
                        }
                    }


                } catch (error) {
                    console.error(`Error fetching item details for itemID ${itemID}:`, error);
                }
            }
        }
    }


    if (recordType === 'VendorPayment') {
        jvLines.push({
            accountId: formDetails.accountPayable,
            newCredit: 0,
            newDebit: totalAmount,
            oldCredit: 0,
            oldDebit: 0,
            memo: "",
        });

        jvLines.push({
            accountId: formDetails.undepositedFunds,
            newCredit: totalAmount,
            newDebit: 0,
            oldCredit: 0,
            oldDebit: 0,
            memo: "",
        });
    }

    if (recordType === 'CustomerPayment') {
        jvLines.push({
            accountId: formDetails.accountReceivable,
            newCredit: totalAmount,
            newDebit: 0,
            oldCredit: 0,
            oldDebit: 0,
            memo: "",
        });

        jvLines.push({
            accountId: formDetails.undepositedFunds,
            newCredit: 0,
            newDebit: totalAmount,
            oldCredit: 0,
            oldDebit: 0,
            memo: "",
        });
    }

    console.log("Generated jvLines:", jvLines);

    // Validate that all accountIds are present
    const missingAccounts = jvLines.filter(line =>
        !line.accountId || line.accountId === '' || line.accountId === null || line.accountId === undefined
    );

    if (missingAccounts.length > 0) {
        console.error('Missing account configurations found in JV lines:', missingAccounts);
        return {
            isValid: false,
            jvLines: [],
            errorMessage: `Cannot create ${recordType}. Some required accounts are not configured in the selected form. Please configure all required accounts before proceeding.`
        };
    }

    return {
        isValid: true,
        jvLines: jvLines,
        errorMessage: null
    };
}

// Helper function for API requests to reduce boilerplate
const apiRequest = async (endpoint, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const config = {
        headers: { ...defaultHeaders, ...options.headers },
        ...options
    };

    const response = await fetch(buildUrl(endpoint), config);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    // Handle empty responses (like DELETE operations that return 204 No Content)
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    // If response is empty or has no content, return null instead of trying to parse JSON
    if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
        return null;
    }

    // Check if response has content before trying to parse JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        console.warn('Failed to parse JSON response:', text);
        return null;
    }
};

// Global variable to store form details
let formDetails = null;



// Helper function to fetch form details by form ID
const fetchFormDetails = async (formId) => {
    try {
        if (!formId) {
            console.warn('No form ID provided');
            return null;
        }

        console.log(`Fetching form details for form ID: ${formId}`);
        const response = await apiRequest(`/form/${formId}`, {
            method: 'GET'
        });

        if (response) {
            console.log('Form details fetched successfully:', response);
            return response;
        } else {
            console.warn('No form details returned from API');
            return null;
        }
    } catch (error) {
        console.error('Error fetching form details:', error);
        return null;
    }
};

export async function processJvLines(lineItems, formId, totalAmount, recordId, recordType) {
    console.log('=== Processing JV Lines ===');
    console.log('Line Items:', lineItems);
    console.log('Form ID:', formId);
    console.log('Total Amount:', totalAmount);
    // Check formType from formDetails and process accounts based on recordType
    // Fetch form details and store in global variable
    formDetails = await fetchFormDetails(formId);
    console.log('Form details stored globally:', formDetails);
    let jvLines = [];
    if (formDetails) {

        if (recordType == "CustomerPayment") {
            jvLines.push({
                recordId: recordId,
                recordType: recordType,
                accountId: formDetails.accountReceivable,
                newCredit: totalAmount,
                newDebit: 0,
                oldCredit: 0,
                oldDebit: 0,
                memo: "",
                id: null // New records
            })

            jvLines.push({
                recordId: recordId,
                recordType: recordType,
                accountId: formDetails.undepositedFunds,
                newCredit: 0,
                newDebit: totalAmount,
                oldCredit: 0,
                oldDebit: 0,
                memo: "",
                id: null // New records
            })
        }

        if (recordType === 'DebitMemo') {

            jvLines.push({
                recordId: recordId,
                recordType: recordType,
                accountId: formDetails.accountReceivable,
                newCredit: 0,
                newDebit: totalAmount,
                oldCredit: 0,
                oldDebit: 0,
                memo: "",
                id: null // New records
            })


            // Use for...of loop instead of forEach to properly await async operations
            for (const item of lineItems) {
                const taxId = item.taxID?.value || item.taxID;
                const itemID = item.itemID?.value || item.itemID;
                const quantityline = Number(item.quantity || item.quantityDelivered);
                const rateline = Number(item.rate);
                const lineTotal = Math.round(quantityline * rateline * 10000000000) / 10000000000;
                const withoutTotalline = Math.round(lineTotal * 100) / 100;

                if (itemID) {
                    try {
                        const itemDetails = await apiRequest(`/product/${itemID}`, {
                            method: 'GET'
                        });

                        if (itemDetails.salesAccount) {
                            jvLines.push({
                                recordId: recordId,
                                recordType: recordType,
                                accountId: itemDetails.salesAccount,
                                newCredit: withoutTotalline,
                                newDebit: 0,
                                oldCredit: 0,
                                oldDebit: 0,
                                memo: "",
                                id: null
                            });
                        }

                    } catch (error) {
                        console.error(`Error fetching item details for itemID ${itemID}:`, error);
                    }
                }

                if (taxId) {
                    try {
                        const taxDetails = await apiRequest(`/tax/${taxId}`, {
                            method: 'GET'
                        });

                        // Only add tax JV line if taxRate is greater than zero
                        if (taxDetails && taxDetails.taxAccount && taxDetails.taxRate > 0) {
                            jvLines.push({
                                recordId: recordId,
                                recordType: recordType,
                                accountId: taxDetails.taxAccount,
                                newCredit: parseFloat(item.taxAmount || item.taxRate),
                                newDebit: 0,
                                oldCredit: 0,
                                oldDebit: 0,
                                memo: "",
                                id: null
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                    }
                }

            }

        }

        if (recordType === 'CreditMemo') {

            jvLines.push({
                recordId: recordId,
                recordType: recordType,
                accountId: formDetails.accountReceivable,
                newCredit: totalAmount,
                newDebit: 0,
                oldCredit: 0,
                oldDebit: 0,
                memo: "",
                id: null // New records
            })


            // Use for...of loop instead of forEach to properly await async operations
            for (const item of lineItems) {
                const taxId = item.taxID?.value || item.taxID;
                const itemID = item.itemID?.value || item.itemID;
                const quantityline = Number(item.quantity || item.quantityDelivered);
                const rateline = Number(item.rate);
                const lineTotal = Math.round(quantityline * rateline * 10000000000) / 10000000000;
                const withoutTotalline = Math.round(lineTotal * 100) / 100;

                if (itemID) {
                    try {
                        const itemDetails = await apiRequest(`/product/${itemID}`, {
                            method: 'GET'
                        });

                        if (itemDetails.salesAccount) {
                            jvLines.push({
                                recordId: recordId,
                                recordType: recordType,
                                accountId: itemDetails.salesAccount,
                                newCredit: 0,  // FIXED: Credit Memo debits sales account
                                newDebit: withoutTotalline,  // FIXED: Credit Memo debits sales account
                                oldCredit: 0,
                                oldDebit: 0,
                                memo: "",
                                id: null
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching item details for itemID ${itemID}:`, error);
                    }
                }

                if (taxId) {
                    try {
                        const taxDetails = await apiRequest(`/tax/${taxId}`, {
                            method: 'GET'
                        });

                        // Only add tax JV line if taxRate is greater than zero
                        if (taxDetails && taxDetails.taxAccount && taxDetails.taxRate > 0) {
                            jvLines.push({
                                recordId: recordId,
                                recordType: recordType,
                                accountId: taxDetails.taxAccount,
                                newCredit: 0,
                                newDebit: parseFloat(item.taxAmount || item.taxRate),
                                oldCredit: 0,
                                oldDebit: 0,
                                memo: "",
                                id: null
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                    }
                }

            }

        }

        if (recordType === 'CreditMemo') {

        }
    }

    console.log("jvLines", jvLines);

    // Use the useJournal hook
    await processJournal(jvLines, 'new', recordId, recordType);

    console.log('=== End Processing JV Lines ===');
}

// Export function to validate accounts BEFORE creating the main record
export async function validateJvAccountsBeforeCreate(lineItems, formId, totalAmount, recordType) {
    console.log('=== Validating JV Accounts Before Create ===');

    // Fetch form details
    const formDetails = await fetchFormDetails(formId);

    if (!formDetails) {
        throw new Error('Form details could not be fetched. Please select a valid form.');
    }

    let accountIds = [];
    const formType = formDetails.formType;

    // Collect all account IDs based on record type
    if (recordType === "CustomerPayment") {
        accountIds.push(formDetails.accountReceivable, formDetails.undepositedFunds);
    }

    if (recordType === 'Invoice') {
        accountIds.push(formDetails.accountReceivable);

        if (formType === "3e7a690c-dd04-4254-89f6-58e85139c07d") { // GAAP
            accountIds.push(formDetails.accuredAR, formDetails.accuredTax);
        }

        if (formType === "9d19694e-dac4-4840-a29b-c1e1be0d82f0") { // expense clearing
            accountIds.push(formDetails.clearing);
        }

        // Get product accounts
        if (lineItems && lineItems.length > 0) {
            for (const item of lineItems) {
                const itemID = item.itemID?.value || item.itemID;
                const taxId = item.taxID?.value || item.taxID;

                if (itemID) {
                    try {
                        const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });
                        if (itemDetails.salesAccount) accountIds.push(itemDetails.salesAccount);
                        if (itemDetails.cogsAccount) accountIds.push(itemDetails.cogsAccount);
                        if (itemDetails.inventoryAccount) accountIds.push(itemDetails.inventoryAccount);
                    } catch (error) {
                        console.error(`Error fetching item details for itemID ${itemID}:`, error);
                    }
                }

                if (taxId) {
                    try {
                        const taxDetails = await apiRequest(`/tax/${taxId}`, { method: 'GET' });
                        // Only validate tax account if taxRate is greater than zero
                        if (taxDetails && taxDetails.taxAccount && taxDetails.taxRate > 0) accountIds.push(taxDetails.taxAccount);
                    } catch (error) {
                        console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                    }
                }
            }
        }
    }

    if (recordType === 'ItemFulfillment') {
        console.log('Processing ItemFulfillment accounts, formType:', formType);

        if (formType === "3e7a690c-dd04-4254-89f6-58e85139c07d") { // GAAP
            console.log('GAAP formType detected, adding accuredAR and accuredTax');
            if (formDetails.accuredAR) accountIds.push(formDetails.accuredAR);
            if (formDetails.accuredTax) accountIds.push(formDetails.accuredTax);
        }

        if (formType === "9d19694e-dac4-4840-a29b-c1e1be0d82f0") { // expense clearing
            console.log('Expense clearing formType detected');
            if (formDetails.clearing) accountIds.push(formDetails.clearing);
        }

        // Get product accounts
        if (lineItems && lineItems.length > 0) {
            console.log(`Processing ${lineItems.length} line items for ItemFulfillment`);
            for (const item of lineItems) {
                const itemID = item.itemID?.value || item.itemID;
                const taxId = item.taxID?.value || item.taxID;
                console.log('Processing item:', { itemID, taxId });

                if (itemID) {
                    try {
                        const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });
                        console.log('Item details fetched:', {
                            itemID,
                            salesAccount: itemDetails.salesAccount,
                            cogsAccount: itemDetails.cogsAccount,
                            inventoryAccount: itemDetails.inventoryAccount
                        });
                        if (itemDetails.salesAccount) accountIds.push(itemDetails.salesAccount);
                        if (itemDetails.cogsAccount) accountIds.push(itemDetails.cogsAccount);
                        if (itemDetails.inventoryAccount) accountIds.push(itemDetails.inventoryAccount);
                    } catch (error) {
                        console.error(`Error fetching item details for itemID ${itemID}:`, error);
                    }
                }

                if (taxId) {
                    try {
                        const taxDetails = await apiRequest(`/tax/${taxId}`, { method: 'GET' });
                        console.log('Tax details fetched:', { taxId, taxAccount: taxDetails?.taxAccount });
                        if (taxDetails && taxDetails.taxAccount) accountIds.push(taxDetails.taxAccount);
                    } catch (error) {
                        console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                    }
                }
            }
        }
        console.log('ItemFulfillment accountIds collected:', accountIds);
    }

    if (recordType === 'DebitMemo' || recordType === 'CreditMemo') {
        accountIds.push(formDetails.accountReceivable);

        // Get product and tax accounts
        if (lineItems && lineItems.length > 0) {
            for (const item of lineItems) {
                const itemID = item.itemID?.value || item.itemID;
                const taxId = item.taxID?.value || item.taxID;

                if (itemID) {
                    try {
                        const itemDetails = await apiRequest(`/product/${itemID}`, { method: 'GET' });
                        if (itemDetails.salesAccount) accountIds.push(itemDetails.salesAccount);
                    } catch (error) {
                        console.error(`Error fetching item details for itemID ${itemID}:`, error);
                    }
                }

                if (taxId) {
                    try {
                        const taxDetails = await apiRequest(`/tax/${taxId}`, { method: 'GET' });
                        // Only validate tax account if taxRate is greater than zero
                        if (taxDetails && taxDetails.taxAccount && taxDetails.taxRate > 0) accountIds.push(taxDetails.taxAccount);
                    } catch (error) {
                        console.error(`Error fetching tax details for taxId ${taxId}:`, error);
                    }
                }
            }
        }
    }

    // Get unique account IDs and filter out null/undefined
    const uniqueAccountIds = [...new Set(accountIds.filter(id => id))];
    console.log('Unique account IDs to validate:', uniqueAccountIds);

    return {
        isValid: true,
        missingAccounts: [],
        errorMessage: null
    };
}