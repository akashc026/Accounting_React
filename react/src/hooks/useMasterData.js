import { useState, useEffect, useCallback, useRef } from 'react';
import { apiConfig, buildUrl } from '../config/api';

// Helper function to remove empty, null, or undefined fields from payload
const cleanPayload = (payload) => {
  const cleaned = {};
  Object.keys(payload).forEach(key => {
    const value = payload[key];
    // Only include non-empty values (excluding empty strings, null, undefined)
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

/**
 * Dynamic Master Data Hook System
 * 
 * This hook system works with ANY master data entity without requiring hardcoded configurations.
 * Simply pass the entity type and it will automatically:
 * - Generate the correct API endpoint
 * - Handle CRUD operations
 * - Preserve all data fields from the API response
 * - Work with custom forms and dynamic fields
 * 
 * Usage Examples:
 * - useMasterData('customer') -> /customer endpoint
 * - useMasterData('product') -> /product endpoint  
 * - useMasterData('my-custom-entity') -> /my-custom-entity endpoint
 * 
 * For convenience, pre-built hooks are exported:
 * - useCustomers(), useVendors(), useProducts(), etc.
 * 
 * Or create your own: createMasterDataHook('any-entity-type')
 */

/**
 * Dynamic configuration generator for any entity type
 * 
 * Automatically generates configuration for any master data entity:
 * - Converts entity type to proper API endpoint format
 * - Handles special naming cases (chart-of-account, item-fulfillment, etc.)
 * - Creates a transformation function that preserves ALL API fields
 * - No hardcoded field mappings - everything is dynamic
 */
const generateEntityConfig = (entityType) => {
  // Convert entity type to different formats
  const entityName = entityType.toLowerCase();
  const kebabCase = entityName.replace(/([A-Z])/g, '-$1').toLowerCase();
  
  // Handle special cases for API endpoints (extensible for new entities)
  const endpointMap = {
    'chartofaccount': 'chart-of-account',
    'chart-of-account': 'chart-of-account',
    'itemfulfillment': 'item-fulfilment',
    'item-fulfillment': 'item-fulfilment',
    'salesorder': 'sales-order',
    'sales-order': 'sales-order',
    'inventoryadjustment': 'inventory-adjustment',
    'inventory-adjustment': 'inventory-adjustment',
    'inventorytransfer': 'inventory-transfer',
    'inventory-transfer': 'inventory-transfer',
    'purchaseorder': 'purchase-order',
    'purchase-order': 'purchase-order',
    'itemreceipt': 'item-receipt',
    'item-receipt': 'item-receipt',
    'vendorbill': 'vendor-bill',
    'vendor-bill': 'vendor-bill',
    'creditmemo': 'credit-memo',
    'credit-memo': 'credit-memo',
    'debitmemo': 'debit-memo',
    'debit-memo': 'debit-memo',
    'vendorcredit': 'vendor-credit',
    'vendor-credit': 'vendor-credit',
    'customerpayment': 'customer-payment',
    'customer-payment': 'customer-payment',
    'vendorpayment': 'vendor-payment',
    'vendor-payment': 'vendor-payment',
    'formsourcetype': 'form-source-type',
    'form-source-type': 'form-source-type'
  };

  const endpoint = endpointMap[entityName] || endpointMap[kebabCase] || entityName;
  const baseUrl = buildUrl(`/${endpoint}`);

  return {
    baseUrl,
    entityName: entityName,
    entityNamePlural: `${entityName}s`,
    entityNamePluralCamelCase: entityName.split('-').map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    ).join('') + 's',
    /**
     * Universal data transformation that preserves ALL fields
     * 
     * Unlike hardcoded transformers, this:
     * - Keeps every field from the API response
     * - Ensures form, sequenceNumber, and custom fields are preserved
     * - Only adds minimal ID handling for common patterns
     * - Works with any entity structure
     */
    transformData: (data) => {
      const transformedData = { ...data };
      
      // Minimal ID normalization for common patterns
      if (!transformedData.id && transformedData.code) {
        transformedData.id = transformedData.code;
      }
      if (!transformedData.id && transformedData.customerCode) {
        transformedData.id = transformedData.customerCode;
      }
      
      return transformedData;
    }
  };
};

// Utility function to parse validation errors from API responses
const parseValidationErrors = (responseData) => {
  if (responseData.errors) {
    // Handle ASP.NET Core validation errors format
    return Object.entries(responseData.errors)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
      .join('\n');
  }
  
  if (responseData.message) {
    return responseData.message;
  }
  
  return 'Validation failed';
};

// Common fetch options used across all API calls
const FETCH_OPTIONS = {
  headers: apiConfig.headers
};

// Main dynamic hook
export const useMasterData = (entityType, options = {}) => {
  const { autoFetch = true } = options;
  const config = generateEntityConfig(entityType);
  
  if (!config) {
    throw new Error(`Unable to generate configuration for entity type: ${entityType}`);
  }

  const [data, setData] = useState({ results: [], totalItems: 0, pageSize: 10, currentPage: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasAutoFetchedRef = useRef(false);

  // Fetch all entities
  const fetchAll = useCallback(async () => {
    const timeoutId = setTimeout(() => {
      setError(`Request timeout: ${config.entityNamePlural} API is taking too long to respond`);
      setLoading(false);
    }, 30000); // 30 second timeout

    try {
      setLoading(true);
      setError(null);
      
      console.log(`[${entityType}] Fetching from URL:`, config.baseUrl);
      
      const response = await fetch(config.baseUrl, {
        method: 'GET',
        ...FETCH_OPTIONS
      }).catch(err => {
        console.error(`[${entityType}] Network error:`, err);
        throw new Error(`Network error: ${err.message}. Please check if the API is running at ${config.baseUrl}`);
      });
      
      console.log(`[${entityType}] Response status:`, response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}${errorText ? `. Body: ${errorText}` : ''}`);
      }
      
      const responseData = await response.json().catch(err => {
        console.error(`[${entityType}] JSON parse error:`, err);
        throw new Error(`Failed to parse response: ${err.message}. Please check the API response format.`);
      });
      
      console.log(`[${entityType}] Raw response data:`, responseData);

      if (!responseData) {
        console.error(`[${entityType}] No data received`);
        throw new Error(`No data received from the ${config.entityNamePlural} API`);
      }

      // Handle different response formats
      let results = [];
      let totalItems = 0;
      let pageSize = 10;
      let currentPage = 1;

      if (responseData.results) {
        // Paginated response
        results = responseData.results;
        totalItems = responseData.totalItems || results.length;
        pageSize = responseData.pageSize || 10;
        currentPage = responseData.currentPage || 1;
      } else if (Array.isArray(responseData)) {
        // Direct array response
        results = responseData;
        totalItems = results.length;
      } else {
        // Single item response
        results = [responseData];
        totalItems = 1;
      }

      // Transform the data using the entity-specific transformer
      const transformedResults = results.map(config.transformData);
      
      console.log(`[${entityType}] Final transformed data:`, {
        results: transformedResults,
        totalItems,
        pageSize,
        currentPage
      });

      setData({
        results: transformedResults,
        totalItems,
        pageSize,
        currentPage
      });

      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [config.baseUrl, config.entityNamePlural]); // Only depend on stable values

  // Fetch single entity by id
  const fetchById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${config.baseUrl}/${id}`, {
        method: 'GET',
        ...FETCH_OPTIONS
      }).catch(err => {
        throw new Error(`Network error: ${err.message}. Please check if the API is running at ${config.baseUrl}`);
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const entityData = await response.json().catch(err => {
        throw new Error(`Failed to parse response: ${err.message}. Please check the API response format.`);
      });
      
      if (!entityData) {
        throw new Error(`${config.entityName} with ID ${id} not found`);
      }

      // Transform the data
      return config.transformData(entityData);
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [config.baseUrl, config.entityName]);

  // Create new entity
  const create = useCallback(async (entityData) => {
    try {
      setLoading(true);
      setError(null);

      // Dynamic validation - check if data exists
      if (!entityData || Object.keys(entityData).length === 0) {
        throw new Error(`Entity data cannot be empty`);
      }

      const response = await fetch(config.baseUrl, {
        method: 'POST',
        ...FETCH_OPTIONS,
        body: JSON.stringify(cleanPayload(entityData))
      }).catch(err => {
        throw new Error(`Network error: ${err.message}. Please check if the API is running at ${config.baseUrl}`);
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (err) {
        responseData = {};
      }

      if (!response.ok) {
        if (response.status === 400) {
          // Handle validation errors
          const validationMessage = parseValidationErrors(responseData);
          throw new Error(`Validation error: \n${validationMessage}`);
        }
        throw new Error(responseData.message || responseData.title || `Failed to create ${config.entityName}. Status: ${response.status}`);
      }
      
      if (!responseData) {
        throw new Error(`Failed to create ${config.entityName} - no data received from API`);
      }

      await fetchAll(); // Refresh the list after creating
      return responseData;
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [config.baseUrl, config.entityName, fetchAll]);

  // Update entity
  const update = useCallback(async (id, entityData) => {
    try {
      setLoading(true);
      setError(null);

      // Dynamic validation - check if data exists
      if (!entityData || Object.keys(entityData).length === 0) {
        throw new Error(`Entity data cannot be empty`);
      }

      const response = await fetch(`${config.baseUrl}/${id}`, {
        method: 'PUT',
        ...FETCH_OPTIONS,
        body: JSON.stringify({ ...entityData, id: String(id) })
      }).catch(err => {
        throw new Error(`Network error: ${err.message}. Please check if the API is running at ${config.baseUrl}`);
      });

      let responseData;
      const responseText = await response.text();
      
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        responseData = { message: responseText };
      }

      if (!response.ok) {
        if (response.status === 400) {
          const validationMessage = parseValidationErrors(responseData);
          throw new Error(`Validation error: \n${validationMessage}`);
        }
        throw new Error(responseData.message || responseData.title || `Failed to update ${config.entityName}. Status: ${response.status}`);
      }

      await fetchAll(); // Refresh the list after updating
      return responseData;
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [config.baseUrl, config.entityName, fetchAll]);

  // Delete entity
  const remove = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${config.baseUrl}/${id}`, {
        method: 'DELETE',
        ...FETCH_OPTIONS
      }).catch(err => {
        throw new Error(`Network error: ${err.message}. Please check if the API is running at ${config.baseUrl}`);
      });

      if (!response.ok) {
        let errorMessage = `Failed to delete ${config.entityName}. Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (e) {
          // Ignore parse errors for delete responses
        }
        throw new Error(errorMessage);
      }

      await fetchAll(); // Refresh the list after deleting
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [config.baseUrl, config.entityName, fetchAll]);

  // Fetch data with pagination
  const fetchWithPagination = useCallback(async (pageNumber = 1, pageSize = 10) => {
    try {
      setLoading(true);
      setError(null);

      // Build URL with pagination parameters
      const url = buildUrl(`/${config.baseUrl.split('/').pop()}?PageNumber=${pageNumber}&PageSize=${pageSize}`);
      const response = await fetch(url, {
        method: 'GET',
        ...FETCH_OPTIONS
      }).catch(err => {
        throw new Error(`Network error: ${err.message}. Please check if the API is running at ${url}`);
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}${errorText ? `. Body: ${errorText}` : ''}`);
      }

      const responseData = await response.json().catch(err => {
        throw new Error(`Failed to parse response: ${err.message}. Please check the API response format.`);
      });

      if (!responseData) {
        throw new Error(`No data received from the API`);
      }

      // Handle different response formats
      let results = [];
      let totalItems = 0;

      if (responseData.results && Array.isArray(responseData.results)) {
        results = responseData.results;
        totalItems = responseData.totalItems || responseData.totalCount || responseData.total || results.length;
      } else if (Array.isArray(responseData)) {
        results = responseData;
        totalItems = results.length;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        results = responseData.data;
        totalItems = responseData.totalItems || responseData.totalCount || responseData.total || results.length;
      } else {
        results = [];
        totalItems = 0;
      }

      // Transform the data
      const transformedResults = results.map(config.transformData);

      return {
        results: transformedResults,
        totalItems,
        pageSize,
        currentPage: pageNumber
      };
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [config.baseUrl, config.transformData]);

  // Load data on mount
  useEffect(() => {
    if (autoFetch && !hasAutoFetchedRef.current) {
      fetchAll();
      hasAutoFetchedRef.current = true;
    }
  }, [autoFetch, fetchAll]);

  // Return the hook's state and functions with dynamic naming
  // Convert kebab-case to PascalCase for function names
  const entityNameCapitalized = config.entityName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  

  return {
    // Data and state
    [config.entityNamePluralCamelCase]: data,
    creditMemos: entityType === 'credit-memo' ? data : undefined,
    debitMemos: entityType === 'debit-memo' ? data : undefined,
    data: data.results || data, // Generic data accessor
    loading,
    error,

    // Core functions with dynamic naming
    refresh: fetchAll,
    [`fetch${entityNameCapitalized}ById`]: fetchById,
    [`create${entityNameCapitalized}`]: create,
    [`update${entityNameCapitalized}`]: update,
    [`delete${entityNameCapitalized}`]: remove,

    // Generic function aliases for consistency
    fetchById,
    create,
    update,
    delete: remove,
    fetchWithPagination,

    // Pagination info
    totalItems: data.totalItems || 0,
    pageSize: data.pageSize || 10,
    currentPage: data.currentPage || 1
  };
};

// Convenience hooks for each entity type
// Dynamic exports - no need for hardcoded entity-specific hooks
export const useCustomers = (options) => useMasterData('customer', options);
export const useVendors = (options) => useMasterData('vendor', options);
export const useChartOfAccount = (options) => useMasterData('chart-of-account', options);
export const useProducts = (options) => useMasterData('product', options);
export const useSalesOrders = (options) => useMasterData('sales-order', options);
export const useTaxes = (options) => useMasterData('tax', options);
export const useItemFulfillments = (options) => useMasterData('item-fulfillment', options);
export const useInvoices = (options) => useMasterData('invoice', options);

// Inventory Management hooks
export const useInventoryAdjustments = (options) => useMasterData('inventory-adjustment', options);
export const useInventoryTransfers = (options) => useMasterData('inventory-transfer', options);

// Purchase Management hooks
export const usePurchaseOrders = (options) => useMasterData('purchase-order', options);
export const useItemReceipts = (options) => useMasterData('item-receipt', options);
export const useVendorBills = (options) => useMasterData('vendor-bill', options);

// Credit/Debit Memo hooks
export const useCreditMemos = (options) => useMasterData('credit-memo', options);
export const useDebitMemos = (options) => useMasterData('debit-memo', options);

// Payment hooks
export const useCustomerPayments = (options) => useMasterData('customer-payment', options);
export const useVendorPayments = (options) => useMasterData('vendor-payment', options);

// Helper function to create dynamic hooks for any entity type
export const createMasterDataHook = (entityType) => {
  return (options) => useMasterData(entityType, options);
};

// Dynamic location hook using the main useMasterData hook
export const useLocations = (options) => useMasterData('location', options);

// Item types hook
export const useItemTypes = (options) => useMasterData('item-type', options);
export const useVendorCredits = (options) => useMasterData('vendor-credit', options);
export const useStatus = (options) => useMasterData('status', options);

/**
 * BENEFITS OF THIS DYNAMIC APPROACH:
 * 
 * ✅ BEFORE: ~350 lines of hardcoded entity configurations
 * ✅ AFTER: ~50 lines of dynamic configuration generation
 * 
 * ✅ BEFORE: Had to define transformData for each entity type
 * ✅ AFTER: One universal transformer preserves ALL fields
 * 
 * ✅ BEFORE: form and sequenceNumber fields were filtered out
 * ✅ AFTER: ALL database fields are automatically preserved
 * 
 * ✅ BEFORE: Required code changes for each new entity
 * ✅ AFTER: Any new entity works automatically
 * 
 * ✅ BEFORE: Hardcoded required field validations per entity
 * ✅ AFTER: Generic validation that works for any entity
 * 
 * USAGE FOR NEW ENTITIES:
 * - Just call useMasterData('your-entity-name')
 * - Or create: const useMyEntity = () => useMasterData('my-entity')
 * - No configuration needed!
 */ 
