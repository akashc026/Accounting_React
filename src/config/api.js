/**
 * API Configuration
 * Centralized configuration for all API endpoints and settings
 */

// Get base URL from environment variable or fall back to default
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://akashc026-001-site1.jtempurl.com';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://accounting-backend-ph-e9drg9e2b2guddag.eastasia-01.azurewebsites.net';

// Default headers for all API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * API Configuration object containing all endpoints and utilities
 */
export const apiConfig = {
  // Base URL for all API calls
  baseURL: API_BASE_URL,
  
  // Default headers
  headers: DEFAULT_HEADERS,
  
  // API Endpoints
  endpoints: {
    // Record Types
    recordType: '/record-type',
    
    // Forms
    forms: '/form',
    formByRecordType: (recordTypeId) => `/form/by-type-of-record/${recordTypeId}`,
    formByTypeOfRecord: (typeOfRecordId) => `/form/by-type-of-record/${typeOfRecordId}`,
    
    // Form Sequences
    formSequence: '/form-sequence',
    formSequenceByForm: (formId) => `/form-sequence/by-form/${formId}`,
    
    // Custom Form Fields
    customFormField: '/custom-form-field',
    customFormFieldByForm: (formId) => `/custom-form-field/by-form/${formId}`,
    
    // Custom Field Values
    customFieldValue: '/custom-field-value',
    customFieldValueByTypeAndRecord: (typeOfRecord, recordId) => 
      `/custom-field-value/by-type-and-record?typeOfRecord=${typeOfRecord}&recordId=${recordId}`,
    
    // Chart of Accounts
    chartOfAccount: '/chart-of-account',
    chartOfAccountByParentNumber: (parentNumber) => `/chart-of-account/by-parent-number/${parentNumber}`,
    
    // Sales Orders
    salesOrderLine: '/salesorderline',
    salesOrderLineByOrder: (orderId) => `/salesorderline/by-salesorder/${orderId}`,
    
    // Item Fulfillment
    itemFulfillmentLine: '/item-fulfilment-line',
    itemFulfillmentLineByOrder: (orderId) => `/item-fulfilment-line/by-item-fulfilment/${orderId}`,
    itemFulfillmentLineByFulfillment: (fulfillmentId) => `/item-fulfilment-line/by-item-fulfillment/${fulfillmentId}`,
    
    // Invoices
    invoice: '/invoice',
    invoiceByCustomer: (customerId) => `/invoice/by-customer/${customerId}`,
    invoiceByCustomerAndLocation: (customerId, locationId) => `/invoice/by-cust-loc/${customerId}/${locationId}`,
    invoiceLine: '/invoice-line',
    invoiceLineByInvoice: (invoiceId) => `/invoice-line/by-invoice/${invoiceId}`,
    
    // Tax
    tax: '/tax',
    
    // Inventory Management
    inventoryAdjustment: '/inventory-adjustment',
    inventoryAdjustmentById: (id) => `/inventory-adjustment/${id}`,
    inventoryAdjustmentLine: '/inventory-adjustment-line',
    inventoryAdjustmentLineByAdjustment: (adjustmentId) => `/inventory-adjustment-line/by-adjustment/${adjustmentId}`,
    
    inventoryTransfer: '/inventory-transfer',
    inventoryTransferById: (id) => `/inventory-transfer/${id}`,
    inventoryTransferLine: '/inventory-transfer-line',
    inventoryTransferLineByTransfer: (transferId) => `/inventory-transfer-line/by-transfer/${transferId}`,
    
    // Purchase Management
    purchaseOrder: '/purchase-order',
    purchaseOrderById: (id) => `/purchase-order/${id}`,
    purchaseOrderLine: '/purchase-order-line',
    purchaseOrderLineByOrder: (orderId) => `/purchase-order-line/by-order/${orderId}`,
    
    itemReceipt: '/item-receipt',
    itemReceiptById: (id) => `/item-receipt/${id}`,
    itemReceiptLine: '/item-receipt-line',
    itemReceiptLineByReceipt: (receiptId) => `/item-receipt-line/by-receipt/${receiptId}`,
    
    vendorBill: '/vendor-bill',
    vendorBillById: (id) => `/vendor-bill/${id}`,
    vendorBillByVendor: (vendorId) => `/vendor-bill/by-vendor/${vendorId}`,
    vendorBillByVendorAndLocation: (vendorId, locationId) => `/vendor-bill/by-vendor-loc/${vendorId}/${locationId}`,
    vendorBillLine: '/vendor-bill-line',
    vendorBillLineByBill: (billId) => `/vendor-bill-line/by-bill/${billId}`,
    
    vendorCredit: '/vendor-credit',
    vendorCreditById: (id) => `/vendor-credit/${id}`,
    vendorCreditLine: '/vendor-credit-line',
    vendorCreditLineByCredit: (creditId) => `/vendor-credit-line/by-credit/${creditId}`,
    
    // Standard Fields (for dynamic forms)
    standardField: '/standard-field',
    standardFieldByRecordType: (recordTypeId) => `/standard-field/by-record-type/${recordTypeId}`,
    
    // Credit Memo
    creditMemo: '/credit-memo',
    creditMemoByCustomer: (customerId) => `/credit-memo/by-customer/${customerId}`,
    
    // Debit Memo
    debitMemo: '/debit-memo',
    debitMemoByCustomer: (customerId) => `/debit-memo/by-customer/${customerId}`,
    debitMemoByCustomerAndLocation: (customerId, locationId) => `/debit-memo/by-cust-loc/${customerId}/${locationId}`,
    
    // Master Data
    customer: '/customer',
    vendor: '/vendor',
    product: '/product',
    location: '/location'
  }
};

/**
 * Utility function to build complete URL
 * @param {string} endpoint - The endpoint path
 * @returns {string} Complete URL
 */
export const buildUrl = (endpoint) => {
  // Handle endpoints that start with '/'
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

/**
 * Utility function for making API requests with default configuration
 * @param {string} endpoint - The endpoint path
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise} Fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildUrl(endpoint);
  const config = {
    headers: { ...DEFAULT_HEADERS, ...options.headers },
    ...options
  };
  
  return fetch(url, config);
};

/**
 * Transaction Configuration for different record types
 */
export const transactionConfig = {
  SalesOrder: {
    endpoint: apiConfig.endpoints.salesOrderLine,
    getEndpoint: (id) => apiConfig.endpoints.salesOrderLineByOrder(id),
    idField: 'soid',
    quantityField: 'quantity'
  },
  ItemFulfillment: {
    endpoint: apiConfig.endpoints.itemFulfillmentLine,
    getEndpoint: (id) => apiConfig.endpoints.itemFulfillmentLineByFulfillment(id),
    idField: 'dnid',
    quantityField: 'quantity'
  },
  Invoice: {
    endpoint: apiConfig.endpoints.invoiceLine,
    getEndpoint: (id) => apiConfig.endpoints.invoiceLineByInvoice(id),
    idField: 'invoiceId',
    quantityField: 'quantityDelivered'
  },
  InventoryAdjustment: {
    endpoint: apiConfig.endpoints.inventoryAdjustmentLine,
    getEndpoint: (id) => apiConfig.endpoints.inventoryAdjustmentLineByAdjustment(id),
    idField: 'adjustmentId',
    quantityField: 'quantityAdjusted'
  },
  InventoryTransfer: {
    endpoint: apiConfig.endpoints.inventoryTransferLine,
    getEndpoint: (id) => apiConfig.endpoints.inventoryTransferLineByTransfer(id),
    idField: 'transferId',
    quantityField: 'quantityTransfer'
  },
  PurchaseOrder: {
    endpoint: apiConfig.endpoints.purchaseOrderLine,
    getEndpoint: (id) => apiConfig.endpoints.purchaseOrderLineByOrder(id),
    idField: 'poid',
    quantityField: 'quantity'
  },
  ItemReceipt: {
    endpoint: apiConfig.endpoints.itemReceiptLine,
    getEndpoint: (id) => apiConfig.endpoints.itemReceiptLineByReceipt(id),
    idField: 'irid',
    quantityField: 'quantity'
  },
  VendorBill: {
    endpoint: apiConfig.endpoints.vendorBillLine,
    getEndpoint: (id) => apiConfig.endpoints.vendorBillLineByBill(id),
    idField: 'vbid',
    quantityField: 'quantityReceived'
  },
  VendorCredit: {
    endpoint: apiConfig.endpoints.vendorCreditLine,
    getEndpoint: (id) => apiConfig.endpoints.vendorCreditLineByCredit(id),
    idField: 'vcid',
    quantityField: 'quantity'
  }
};

// Export individual utilities for convenience
export { API_BASE_URL, DEFAULT_HEADERS };

// Default export
export default apiConfig;
