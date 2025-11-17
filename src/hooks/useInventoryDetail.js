import { useState, useCallback } from 'react';
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
 * Custom React Hook for Managing Inventory Details
 * 
 * This hook provides a clean interface for creating or updating inventory detail records.
 * It handles the logic of checking if an item with a given location exists, and either
 * creates a new record or updates the existing one with the adjusted quantity.
 * 
 * Features:
 * - Automatic existence checking by location
 * - Create new inventory detail if not found
 * - Update existing inventory detail if found
 * - Proper error handling and loading states
 * - Follows project's API patterns and conventions
 * 
 * Usage:
 * const { createOrUpdateInventoryDetail, loading, error } = useInventoryDetail();
 * 
 * await createOrUpdateInventoryDetail({
 *   itemId: 'item-guid',
 *   locationId: 'location-guid', 
 *   quantity: 100
 * });
 */

const useInventoryDetail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common fetch options
  const FETCH_OPTIONS = {
    headers: apiConfig.headers
  };

  /**
   * Check if an inventory detail exists for the given item and location
   * @param {string} itemId - The item ID
   * @param {string} locationId - The location ID
   * @returns {Promise<object|null>} Existing inventory detail or null
   */
  const checkInventoryDetailExists = useCallback(async (itemId, locationId) => {
    try {
      // Query inventory details by item and location
      // Using the pattern from the existing API structure
      const url = buildUrl(`/inventory-detail?ItemId=${itemId}&LocationId=${locationId}`);
      console.log('Checking inventory detail for item:', itemId, 'and location:', locationId);
      console.log('URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        ...FETCH_OPTIONS
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Not found is expected
        }
        console.error('❌ API Error:', response.status, 'for URL:', url);
        throw new Error(`Failed to check inventory detail. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      // Handle the API response format: {"results":[...], "pageSize":10, "currentPage":1, "totalItems":1}
      if (data.results && Array.isArray(data.results)) {
        return data.results.length > 0 ? data.results[0] : null;
      } else if (Array.isArray(data)) {
        return data.length > 0 ? data[0] : null;
      } else if (data && data.id) {
        return data;
      }

      return null;
    } catch (err) {
      console.error('❌ Error checking inventory detail existence:', err);
      throw err;
    }
  }, []);

  /**
   * Bulk create inventory detail records (NEW BULK API)
   * @param {Array<object>} inventoryDetailsArray - Array of inventory detail data
   * @returns {Promise<Array<object>>} Created inventory details
   */
  const bulkCreateInventoryDetails = useCallback(async (inventoryDetailsArray) => {
    try {
      if (!Array.isArray(inventoryDetailsArray) || inventoryDetailsArray.length === 0) {
        throw new Error('inventoryDetailsArray must be a non-empty array');
      }

      const url = buildUrl('/inventory-detail');

      // Clean each detail object
      const cleanedDetails = inventoryDetailsArray.map(detail => cleanPayload(detail));

      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ details: cleanedDetails }),
        ...FETCH_OPTIONS
      });

      if (!response.ok) {
        let errorMessage = `Failed to bulk create inventory details. Status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            // Handle ASP.NET Core validation errors
            errorMessage = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // Use default error message if parsing fails
        }
        throw new Error(errorMessage);
      }

      const createdData = await response.json();
      console.log(`✅ Bulk created ${inventoryDetailsArray.length} inventory details`);
      return createdData;
    } catch (err) {
      console.error('Error bulk creating inventory details:', err);
      throw err;
    }
  }, []);

  /**
   * Create a new inventory detail record (wrapper for bulk API)
   * @param {object} inventoryData - The inventory detail data
   * @returns {Promise<object>} Created inventory detail
   */
  const createInventoryDetail = useCallback(async (inventoryData) => {
    try {
      // Use bulk API with single item
      const results = await bulkCreateInventoryDetails([inventoryData]);
      return Array.isArray(results) ? results[0] : results;
    } catch (err) {
      console.error('Error creating inventory detail:', err);
      throw err;
    }
  }, []);

  /**
   * Bulk update inventory detail records (NEW BULK API)
   * @param {Array<object>} inventoryDetailsArray - Array of inventory detail data (must include id for each)
   * @returns {Promise<Array<object>>} Updated inventory details
   */
  const bulkUpdateInventoryDetails = useCallback(async (inventoryDetailsArray) => {
    try {
      if (!Array.isArray(inventoryDetailsArray) || inventoryDetailsArray.length === 0) {
        throw new Error('inventoryDetailsArray must be a non-empty array');
      }

      // Validate that all items have an id
      const missingIds = inventoryDetailsArray.filter(detail => !detail.id);
      if (missingIds.length > 0) {
        throw new Error('All inventory details must have an id for bulk update');
      }

      const url = buildUrl('/inventory-detail');

      const response = await fetch(url, {
        method: 'PUT',
        body: JSON.stringify({ details: inventoryDetailsArray }),
        ...FETCH_OPTIONS
      });

      if (!response.ok) {
        let errorMessage = `Failed to bulk update inventory details. Status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            // Handle ASP.NET Core validation errors
            errorMessage = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // Use default error message if parsing fails
        }
        throw new Error(errorMessage);
      }

      const updatedData = await response.json();
      console.log(`✅ Bulk updated ${inventoryDetailsArray.length} inventory details`);
      return updatedData;
    } catch (err) {
      console.error('Error bulk updating inventory details:', err);
      throw err;
    }
  }, []);

  /**
   * Update an existing inventory detail record (wrapper for bulk API)
   * @param {string} id - The inventory detail ID
   * @param {object} inventoryData - The updated inventory detail data
   * @returns {Promise<object>} Updated inventory detail
   */
  const updateInventoryDetail = useCallback(async (id, inventoryData) => {
    try {
      // Use bulk API with single item
      const results = await bulkUpdateInventoryDetails([{ ...inventoryData, id }]);
      return Array.isArray(results) ? results[0] : results;
    } catch (err) {
      console.error('Error updating inventory detail:', err);
      throw err;
    }
  }, []);

  /**
   * Check if a product is an inventory item (not a service item)
   * @param {string} itemId - The product/item ID
   * @returns {Promise<boolean>} True if inventory item, false if service item
   */
  const isInventoryItem = useCallback(async (itemId) => {
    // Inventory Item ID constant
    const INVENTORY_ITEM_TYPE_ID = "ef765a67-402b-48ee-b898-8eaa45affb64";

    if (!itemId) {
      return false;
    }

    try {
      const url = buildUrl(`/product/${itemId}`);
      console.log('Checking if product is inventory item:', itemId);

      const response = await fetch(url, {
        method: 'GET',
        ...FETCH_OPTIONS
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Product not found:', itemId);
          return false;
        }
        console.error('❌ API Error fetching product:', response.status, 'for URL:', url);
        return false;
      }

      const product = await response.json();
      const isInventory = product.itemType === INVENTORY_ITEM_TYPE_ID;
      console.log(`📦 Product ${itemId} is ${isInventory ? 'INVENTORY' : 'SERVICE'} item`);
      return isInventory;
    } catch (err) {
      console.error('❌ Failed to check product type:', err.message);
      return false;
    }
  }, []);

  /**
   * Main function to create or update inventory detail
   * This is the primary interface that components will use
   *
   * @param {object} params - The inventory detail parameters
   * @param {string} params.itemId - The item ID (required)
   * @param {string} params.locationId - The location ID (required)
   * @param {number} params.quantity - The quantity to set/adjust (required)
   * @param {object} params.additionalData - Any additional data to include
   * @returns {Promise<object>} The created or updated inventory detail
   */
  const createOrUpdateInventoryDetail = useCallback(async ({
    itemId,
    locationId,
    quantity,
    additionalData = {}
  }) => {
    // Validate required parameters
    if (!itemId || !locationId || quantity === undefined || quantity === null) {
      throw new Error('itemId, locationId, and quantity are required parameters');
    }

    setLoading(true);
    setError(null);

    try {
      // Check if the item is an inventory item (not a service item)
      const isInventory = await isInventoryItem(itemId);
      if (!isInventory) {
        console.warn(`⚠️ Item ${itemId} is a service item. Skipping inventory update (only inventory items are tracked).`);
        // Return null to indicate operation was skipped - don't throw error
        setLoading(false);
        return null;
      }

      // Check if inventory detail already exists
      const existingDetail = await checkInventoryDetailExists(itemId, locationId);

      const inventoryData = {
        itemId,
        locationId,
        quantity: Number(quantity),
        ...additionalData
      };

      let result;

      if (existingDetail) {

        // Update existing record
        // Handle null quantityAvailable by treating it as 0
        const currentQuantity = existingDetail.quantityAvailable || existingDetail.quantity || 0;
        const newQuantity = currentQuantity + Number(quantity);
        result = await updateInventoryDetail(existingDetail.id, {
          ...inventoryData,
          quantityAvailable: newQuantity
        });
      } else {
        // Create new record with quantityAvailable field
        result = await createInventoryDetail({
          ...inventoryData,
          quantityAvailable: Number(quantity)
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred while managing inventory detail';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [checkInventoryDetailExists, createInventoryDetail, updateInventoryDetail, isInventoryItem]);

  /**
   * Get inventory detail by item and location
   * Useful for checking current inventory levels
   * 
   * @param {string} itemId - The item ID
   * @param {string} locationId - The location ID
   * @returns {Promise<object|null>} The inventory detail or null if not found
   */
  const getInventoryDetail = useCallback(async (itemId, locationId) => {
    if (!itemId || !locationId) {
      throw new Error('itemId and locationId are required parameters');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await checkInventoryDetailExists(itemId, locationId);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred while fetching inventory detail';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [checkInventoryDetailExists]);

  /**
   * Get quantity available for an item at a specific location
   * This is a lightweight function specifically for populating "Qty In Hand" fields
   * 
   * @param {string} itemId - The item ID
   * @param {string} locationId - The location ID
   * @returns {Promise<number>} The available quantity (0 if not found)
   */
  const getQuantityAvailable = useCallback(async (itemId, locationId) => {
    if (!itemId || !locationId) {
      return 0; // Return 0 instead of throwing error for UI convenience
    }

    try {
      const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
      const quantity = inventoryDetail ? (inventoryDetail.quantityAvailable || 0) : 0;
      console.log('📦 Inventory quantity fetched:', quantity, 'for item:', itemId);
      return quantity;
    } catch (err) {
      console.error('❌ Failed to fetch quantity available:', err.message);
      return 0; // Return 0 on error for UI convenience
    }
  }, [checkInventoryDetailExists]);

  /**
   * Validate if sufficient inventory is available for ItemFulfillment
   * This function checks if requested quantities are available in inventory
   *
   * @param {Array} lineItems - Array of line items with itemID and quantity
   * @param {string} locationId - The location ID
   * @returns {Promise<object>} Validation result {isValid: boolean, errors: Array}
   */
  const validateInventoryAvailability = useCallback(async (lineItems, locationId) => {
    const errors = [];

    if (!locationId) {
      return { isValid: false, errors: ['Location is required for inventory validation'] };
    }

    if (!lineItems || lineItems.length === 0) {
      return { isValid: true, errors: [] };
    }

    for (const line of lineItems) {
      try {
        const itemId = line.itemID?.value || line.itemID;
        const requestedQty = Number(line.quantity || 0);

        if (!itemId || requestedQty <= 0) {
          continue; // Skip items without ID or zero quantity
        }

        // Check if item is an inventory item
        const isInventory = await isInventoryItem(itemId);
        if (!isInventory) {
          console.log(`Item ${itemId} is a service item, skipping inventory check`);
          continue; // Skip service items
        }

        // Get available quantity
        const availableQty = await getQuantityAvailable(itemId, locationId);

        console.log(`Inventory validation for item ${itemId}: available=${availableQty}, requested=${requestedQty}`);

        if (availableQty < requestedQty) {
          // Get product details for error message
          try {
            const productUrl = buildUrl(`/product/${itemId}`);
            const productResponse = await fetch(productUrl, {
              method: 'GET',
              ...FETCH_OPTIONS
            });

            let itemName = itemId;
            if (productResponse.ok) {
              const product = await productResponse.json();
              itemName = product.itemName || product.itemCode || itemId;
            }

            errors.push({
              itemId,
              itemName,
              availableQty,
              requestedQty,
              message: `Insufficient inventory for ${itemName}. Available: ${availableQty}, Requested: ${requestedQty}`
            });
          } catch (err) {
            errors.push({
              itemId,
              itemName: itemId,
              availableQty,
              requestedQty,
              message: `Insufficient inventory. Available: ${availableQty}, Requested: ${requestedQty}`
            });
          }
        }
      } catch (err) {
        console.error(`Error validating inventory for item ${line.itemID}:`, err.message);
        errors.push({
          itemId: line.itemID,
          message: `Failed to validate inventory: ${err.message}`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [isInventoryItem, getQuantityAvailable]);

  /**
   * Bulk set inventory quantities (replaces existing quantities instead of adjusting)
   *
   * @param {Array<object>} itemsArray - Array of inventory items
   * @param {string} itemsArray[].itemId - The item ID (required)
   * @param {string} itemsArray[].locationId - The location ID (required)
   * @param {number} itemsArray[].quantity - The absolute quantity to set (required)
   * @param {object} itemsArray[].additionalData - Any additional data to include
   * @returns {Promise<Array<object>>} Array of created or updated inventory details
   */
  const bulkSetInventoryQuantity = useCallback(async (itemsArray) => {
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
      throw new Error('itemsArray must be a non-empty array');
    }

    setLoading(true);
    setError(null);

    try {
      // Filter out service items
      const inventoryItemsChecks = await Promise.all(
        itemsArray.map(async (item) => ({
          ...item,
          isInventory: await isInventoryItem(item.itemId)
        }))
      );

      const inventoryItems = inventoryItemsChecks.filter(item => item.isInventory);

      if (inventoryItems.length === 0) {
        console.warn('⚠️ All items are service items. Skipping inventory update.');
        setLoading(false);
        return [];
      }

      // Check which items already exist
      const existenceChecks = await Promise.all(
        inventoryItems.map(async (item) => ({
          ...item,
          existingDetail: await checkInventoryDetailExists(item.itemId, item.locationId)
        }))
      );

      // Separate into updates and creates
      const toUpdate = existenceChecks
        .filter(item => item.existingDetail)
        .map(item => ({
          id: item.existingDetail.id,
          itemId: item.itemId,
          locationId: item.locationId,
          quantityAvailable: Number(item.quantity),
          ...(item.additionalData || {})
        }));

      const toCreate = existenceChecks
        .filter(item => !item.existingDetail)
        .map(item => ({
          itemId: item.itemId,
          locationId: item.locationId,
          quantityAvailable: Number(item.quantity),
          ...(item.additionalData || {})
        }));

      console.log(`📦 Bulk set inventory: ${toUpdate.length} updates, ${toCreate.length} creates`);

      const results = [];

      // Execute bulk update if needed
      if (toUpdate.length > 0) {
        const updateResults = await bulkUpdateInventoryDetails(toUpdate);
        results.push(...(Array.isArray(updateResults) ? updateResults : [updateResults]));
      }

      // Execute bulk create if needed
      if (toCreate.length > 0) {
        const createResults = await bulkCreateInventoryDetails(toCreate);
        results.push(...(Array.isArray(createResults) ? createResults : [createResults]));
      }

      return results;
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred while bulk setting inventory quantities';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [checkInventoryDetailExists, bulkCreateInventoryDetails, bulkUpdateInventoryDetails, isInventoryItem]);

  /**
   * Set absolute quantity (replaces existing quantity instead of adjusting)
   *
   * @param {object} params - The inventory detail parameters
   * @param {string} params.itemId - The item ID (required)
   * @param {string} params.locationId - The location ID (required)
   * @param {number} params.quantity - The absolute quantity to set (required)
   * @param {object} params.additionalData - Any additional data to include
   * @returns {Promise<object>} The created or updated inventory detail
   */
  const setInventoryQuantity = useCallback(async ({
    itemId,
    locationId,
    quantity,
    additionalData = {}
  }) => {
    // Validate required parameters
    if (!itemId || !locationId || quantity === undefined || quantity === null) {
      throw new Error('itemId, locationId, and quantity are required parameters');
    }

    // Use bulk function with single item
    const results = await bulkSetInventoryQuantity([{ itemId, locationId, quantity, additionalData }]);
    return results.length > 0 ? results[0] : null;
  }, [bulkSetInventoryQuantity]);

  /**
   * Fetch the standard cost for a product by its ID
   * @param {string} productId - The product ID
   * @returns {Promise<number>} The standard cost (0 if not found)
   */
  const getProductStandardCost = useCallback(async (productId) => {
    if (!productId) {
      return 0;
    }

    try {
      const url = buildUrl(`/product/${productId}`);
      console.log('Fetching product standard cost for:', productId);

      const response = await fetch(url, {
        method: 'GET',
        ...FETCH_OPTIONS
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Product not found:', productId);
          return 0;
        }
        console.error('❌ API Error fetching product:', response.status, 'for URL:', url);
        throw new Error(`Failed to fetch product. Status: ${response.status}`);
      }

      const product = await response.json();
      const standardCost = product.standardCost || 0;
      console.log('📦 Product standard cost fetched:', standardCost, 'for product:', productId);
      return standardCost;
    } catch (err) {
      console.error('❌ Failed to fetch product standard cost:', err.message);
      return 0;
    }
  }, []);


  const getProductSalesPriceTaxCode = useCallback(async (productId) => {
    if (!productId) {
      return "";
    }

    try {
      const url = buildUrl(`/product/${productId}`);
      console.log('Fetching product average cost and sales tax code for:', productId);

      const response = await fetch(url, {
        method: 'GET',
        ...FETCH_OPTIONS
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Product not found:', productId);
          return 0;
        }
        console.error('❌ API Error fetching product:', response.status, 'for URL:', url);
        throw new Error(`Failed to fetch product. Status: ${response.status}`);
      }

      const product = await response.json();
      const salesPrice = product.salesPrice || 0;
      const taxCode = product.salesTaxCode || "";
      console.log('📦 Product sales price and tax code fetched:', salesPrice, 'for product:', productId);
      return { salesPrice: salesPrice, taxCode: taxCode }
    } catch (err) {
      console.error('❌ Failed to fetch product sales price and tax code:', err.message);
      return { salesPrice: 0, taxCode: "" };
    }
  }, []);


  
  const getProductPurchasePriceTaxCode = useCallback(async (productId) => {
    if (!productId) {
      return "";
    }

    try {
      const url = buildUrl(`/product/${productId}`);
      console.log('Fetching product purchase price and tax code for:', productId);

      const response = await fetch(url, {
        method: 'GET',
        ...FETCH_OPTIONS
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Product not found:', productId);
          return 0;
        }
        console.error('❌ API Error fetching product:', response.status, 'for URL:', url);
        throw new Error(`Failed to fetch product. Status: ${response.status}`);
      }

      const product = await response.json();
      const purchasePrice = product.purchasePrice || 0;
      const taxCode = product.purchaseTaxCode || "";
      console.log('📦 Product purchase price and tax code fetched:', purchasePrice, 'for product:', productId);
      return { purchasePrice: purchasePrice, taxCode: taxCode }
    } catch (err) {
      console.error('❌ Failed to fetch product purchase price and tax code:', err.message);
      return { purchasePrice: 0, taxCode: "" };
    }
  }, []);

  /**
   * Calculate new average cost after ItemFulfillment
   * @param {number} currentAvgCost - Current average cost from product
   * @param {number} availableQty - Current available quantity from inventory
   * @param {number} fulfillmentQty - Quantity being fulfilled
   * @returns {object} {newAvgCost, cogs, newQuantity, newValue}
   */
  const calculateFulfillmentCost = useCallback((currentAvgCost, availableQty, fulfillmentQty) => {
    // 1. Calculate Current Value
    const currentTotalValue = currentAvgCost * availableQty;

    // 2. Calculate COGS (Cost of Goods Sold)
    const cogs = fulfillmentQty * currentAvgCost;

    // 3. Calculate Remaining Quantity
    const newQuantity = availableQty - fulfillmentQty;

    // 4. Calculate Remaining Value
    const newValue = currentTotalValue - cogs;

    // 5. Calculate New Average Cost
    let newAvgCost = 0;
    if (newQuantity > 0) {
      newAvgCost = newValue / newQuantity;
    }

    console.log('💰 Cost Calculation (Fulfillment):', {
      currentAvgCost,
      availableQty,
      fulfillmentQty,
      currentTotalValue,
      cogs,
      newQuantity,
      newValue,
      newAvgCost
    });

    return {
      newAvgCost: newAvgCost,
      cogs: cogs,
      newQuantity: newQuantity,
      newValue: newValue
    };
  }, []);

  /**
   * Simulates the reversal (deletion) of an Item Fulfillment transaction
   * @param {number} currentAvgCost - The Average Cost *after* the original fulfillment (current state)
   * @param {number} currentQuantity - The Quantity *after* the original fulfillment (current state)
   * @param {number} fulfilledQuantity - The quantity that was fulfilled and is now being reversed
   * @param {number} originalFulfillmentAvgCost - The Average Cost *used* when item was originally fulfilled
   * @returns {object} {newAvgCost, newQuantity, newTotalValue}
   */
  const reverseItemFulfillment = useCallback((currentAvgCost, currentQuantity, fulfilledQuantity, originalFulfillmentAvgCost) => {
    // 1. Calculate the current Total Value *before* reversal
    const currentTotalValue = currentAvgCost * currentQuantity;

    // 2. Calculate the Value (COGS) to be added back
    const valueToAddBack = fulfilledQuantity * originalFulfillmentAvgCost;

    // 3. Calculate New Total Value and Quantity
    const newTotalValue = currentTotalValue + valueToAddBack;
    const newQuantity = currentQuantity + fulfilledQuantity;

    // 4. Calculate the New Average Cost
    let newAvgCost = 0;
    if (newQuantity > 0) {
      newAvgCost = newTotalValue / newQuantity;
    }

    console.log('💰 Cost Calculation (Reverse):', {
      currentAvgCost,
      currentQuantity,
      fulfilledQuantity,
      originalFulfillmentAvgCost,
      currentTotalValue,
      valueToAddBack,
      newTotalValue,
      newQuantity,
      newAvgCost
    });

    return {
      newAvgCost: newAvgCost,
      newQuantity: newQuantity,
      newTotalValue: newTotalValue
    };
  }, []);

  /**
   * Update product average cost
   * @param {string} productId - The product ID
   * @param {number} newAvgCost - The new average cost to set
   * @returns {Promise<object>} Updated product
   */
  const updateProductAverageCost = useCallback(async (productId, newAvgCost) => {
    if (!productId) {
      throw new Error('productId is required');
    }

    try {
      const url = buildUrl(`/product/${productId}`);
      console.log('📝 Updating product average cost:', productId, 'New cost:', newAvgCost);

      const response = await fetch(url, {
        method: 'PUT',
        body: JSON.stringify({
          averageCost: Number(newAvgCost)
        }),
        ...FETCH_OPTIONS
      });

      if (!response.ok) {
        console.error('❌ API Error updating product average cost:', response.status);
        throw new Error(`Failed to update product average cost. Status: ${response.status}`);
      }

      const updatedProduct = await response.json();
      console.log('✅ Product average cost updated successfully');
      return updatedProduct;
    } catch (err) {
      console.error('❌ Failed to update product average cost:', err.message);
      throw err;
    }
  }, []);

  /**
   * Get total quantity across all locations for an item
   * @param {string} itemId - The item ID
   * @returns {Promise<number>} Total quantity across all locations
   */
  const getTotalQuantityAllLocations = useCallback(async (itemId) => {
    if (!itemId) {
      return 0;
    }

    try {
      const url = buildUrl(`/inventory-detail?ItemId=${itemId}`);
      console.log('Fetching total quantity for item across all locations:', itemId);

      const response = await fetch(url, {
        method: 'GET',
        ...FETCH_OPTIONS
      });

      if (!response.ok) {
        if (response.status === 404) {
          return 0; // No inventory found
        }
        console.error('❌ API Error fetching inventory details:', response.status);
        return 0;
      }

      const data = await response.json();
      let inventoryRecords = [];

      // Handle different response formats
      if (data.results && Array.isArray(data.results)) {
        inventoryRecords = data.results;
      } else if (Array.isArray(data)) {
        inventoryRecords = data;
      }

      // Sum up quantities across all locations
      const totalQty = inventoryRecords.reduce((sum, record) => {
        return sum + Number(record.quantityAvailable || 0);
      }, 0);

      console.log(`📦 Total quantity for item ${itemId} across all locations: ${totalQty}`);
      return totalQty;
    } catch (err) {
      console.error('❌ Failed to fetch total quantity:', err.message);
      return 0;
    }
  }, []);

  /**
   * Calculate new average cost after ItemReceipt (global calculation)
   * @param {number} existingQty - Total existing quantity across ALL locations
   * @param {number} existingAvgCost - Current average cost from product
   * @param {number} receiptQty - Quantity being received
   * @param {number} receiptRate - Cost per unit from receipt
   * @returns {object} {newAvgCost, newTotalValue, newTotalQty}
   */
  const calculateAverageCost = useCallback((existingQty, existingAvgCost, receiptQty, receiptRate) => {
    // Handle blank, null, undefined values - treat as 0
    const safeExistingQty = existingQty === null || existingQty === undefined || existingQty === '' ? 0 : Number(existingQty);
    const safeExistingAvgCost = existingAvgCost === null || existingAvgCost === undefined || existingAvgCost === '' ? 0 : Number(existingAvgCost);
    const safeReceiptQty = receiptQty === null || receiptQty === undefined || receiptQty === '' ? 0 : Number(receiptQty);
    const safeReceiptRate = receiptRate === null || receiptRate === undefined || receiptRate === '' ? 0 : Number(receiptRate);

    // Step 1: Calculate existing inventory value
    const existingValue = safeExistingQty * safeExistingAvgCost;

    // Step 2: Calculate new receipt value
    const receiptValue = safeReceiptQty * safeReceiptRate;

    // Step 3: Calculate new totals
    const newTotalQty = safeExistingQty + safeReceiptQty;
    const newTotalValue = existingValue + receiptValue;

    // Step 4: Calculate new average cost per unit
    const newAvgCost = newTotalQty > 0 ? newTotalValue / newTotalQty : 0;

    console.log('💰 Global Average Cost Calculation (Receipt):', {
      existingQty: safeExistingQty,
      existingAvgCost: safeExistingAvgCost,
      receiptQty: safeReceiptQty,
      receiptRate: safeReceiptRate,
      existingValue,
      receiptValue,
      newTotalQty,
      newTotalValue,
      newAvgCost
    });

    return {
      newAvgCost,
      newTotalValue,
      newTotalQty
    };
  }, []);

  /**
   * Bulk process ItemReceipt inventory and cost updates
   * This handles: inventory increase, global average cost calculation, and product update for multiple items
   *
   * @param {Array<object>} receiptsArray - Array of receipt items
   * @param {string} receiptsArray[].itemId - The item ID
   * @param {string} receiptsArray[].locationId - The location ID where items are being received
   * @param {number} receiptsArray[].receiptQty - Quantity being received
   * @param {number} receiptsArray[].receiptCost - Cost per unit from the receipt/PO
   * @param {string} receiptsArray[].mode - Only 'create' is supported
   * @returns {Promise<Array<object>>} Results with updated inventory and cost info
   */
  const bulkProcessItemReceipt = useCallback(async (receiptsArray) => {
    if (!Array.isArray(receiptsArray) || receiptsArray.length === 0) {
      throw new Error('receiptsArray must be a non-empty array');
    }

    // Validate all are create mode
    const invalidModes = receiptsArray.filter(r => r.mode !== 'create');
    if (invalidModes.length > 0) {
      throw new Error('Only create mode is supported for ItemReceipt. Edit and delete modes are not supported.');
    }

    try {
      console.log(`🔄 Bulk processing ${receiptsArray.length} ItemReceipts`);

      // Filter out service items
      const inventoryChecks = await Promise.all(
        receiptsArray.map(async (receipt) => ({
          ...receipt,
          isInventory: await isInventoryItem(receipt.itemId)
        }))
      );

      const inventoryReceipts = inventoryChecks.filter(r => r.isInventory);

      if (inventoryReceipts.length === 0) {
        console.warn('⚠️ All items are service items. Skipping inventory and cost updates.');
        return receiptsArray.map(r => ({ skipped: true, reason: 'Service item', itemId: r.itemId }));
      }

      // Get all product data and calculate new costs
      const productUpdates = await Promise.all(
        inventoryReceipts.map(async (receipt) => {
          const productUrl = buildUrl(`/product/${receipt.itemId}`);
          const productResponse = await fetch(productUrl, {
            method: 'GET',
            ...FETCH_OPTIONS
          });

          if (!productResponse.ok) {
            throw new Error(`Failed to fetch product ${receipt.itemId}. Status: ${productResponse.status}`);
          }

          const product = await productResponse.json();
          const existingAvgCost = product.averageCost === null ||
                                   product.averageCost === undefined ||
                                   product.averageCost === '' ||
                                   product.averageCost === 0
                                   ? 0
                                   : Number(product.averageCost);

          const existingTotalQty = await getTotalQuantityAllLocations(receipt.itemId);

          const costCalculation = calculateAverageCost(
            existingTotalQty,
            existingAvgCost,
            receipt.receiptQty,
            receipt.receiptCost
          );

          const inventoryDetail = await checkInventoryDetailExists(receipt.itemId, receipt.locationId);
          const currentLocationQty = inventoryDetail ? Number(inventoryDetail.quantityAvailable || 0) : 0;
          const newLocationQty = currentLocationQty + receipt.receiptQty;

          return {
            receipt,
            existingAvgCost,
            existingTotalQty,
            costCalculation,
            currentLocationQty,
            newLocationQty
          };
        })
      );

      // Bulk update inventory quantities
      const inventoryUpdates = productUpdates.map(update => ({
        itemId: update.receipt.itemId,
        locationId: update.receipt.locationId,
        quantity: update.newLocationQty
      }));

      await bulkSetInventoryQuantity(inventoryUpdates);

      // Update product average costs (one by one as they're different products)
      await Promise.all(
        productUpdates.map(async (update) =>
          updateProductAverageCost(update.receipt.itemId, update.costCalculation.newAvgCost)
        )
      );

      console.log(`✅ Bulk ItemReceipt processing complete for ${inventoryReceipts.length} items`);

      return productUpdates.map(update => ({
        success: true,
        mode: 'create',
        itemId: update.receipt.itemId,
        inventory: {
          locationOldQuantity: update.currentLocationQty,
          locationNewQuantity: update.newLocationQty,
          globalOldQuantity: update.existingTotalQty,
          globalNewQuantity: update.costCalculation.newTotalQty
        },
        cost: {
          oldAvgCost: update.existingAvgCost,
          newAvgCost: update.costCalculation.newAvgCost,
          ...update.costCalculation
        }
      }));

    } catch (err) {
      console.error('❌ Error bulk processing ItemReceipts:', err.message);
      throw err;
    }
  }, [isInventoryItem, checkInventoryDetailExists, getTotalQuantityAllLocations, calculateAverageCost, bulkSetInventoryQuantity, updateProductAverageCost]);

  /**
   * Process ItemReceipt inventory and cost updates
   * This handles: inventory increase, global average cost calculation, and product update
   *
   * @param {string} itemId - The item ID
   * @param {string} locationId - The location ID where items are being received
   * @param {number} receiptQty - Quantity being received
   * @param {number} receiptCost - Cost per unit from the receipt/PO
   * @param {string} mode - Only 'create' is supported
   * @returns {Promise<object>} Result with updated inventory and cost info
   */
  const processItemReceipt = useCallback(async ({ itemId, locationId, receiptQty, receiptCost, mode }) => {
    if (!itemId || !locationId || receiptQty === undefined || receiptQty === null || receiptCost === undefined) {
      throw new Error('itemId, locationId, receiptQty, and receiptCost are required');
    }

    // Use bulk function with single item
    const results = await bulkProcessItemReceipt([{ itemId, locationId, receiptQty, receiptCost, mode }]);
    return results.length > 0 ? results[0] : null;
  }, [bulkProcessItemReceipt]);

  /**
   * Bulk process ItemFulfillment inventory and cost updates
   * This handles: inventory reduction, average cost calculation, and product update for multiple items
   *
   * @param {Array<object>} fulfillmentsArray - Array of fulfillment items
   * @param {string} fulfillmentsArray[].itemId - The item ID
   * @param {string} fulfillmentsArray[].locationId - The location ID
   * @param {number} fulfillmentsArray[].fulfillmentQty - Quantity being fulfilled
   * @param {string} fulfillmentsArray[].mode - Only 'create' is supported
   * @returns {Promise<Array<object>>} Results with updated inventory and cost info
   */
  const bulkProcessItemFulfillment = useCallback(async (fulfillmentsArray) => {
    if (!Array.isArray(fulfillmentsArray) || fulfillmentsArray.length === 0) {
      throw new Error('fulfillmentsArray must be a non-empty array');
    }

    // Validate all are create mode
    const invalidModes = fulfillmentsArray.filter(f => f.mode !== 'create');
    if (invalidModes.length > 0) {
      throw new Error('Only create mode is supported for ItemFulfillment. Edit and delete modes are not supported.');
    }

    try {
      console.log(`🔄 Bulk processing ${fulfillmentsArray.length} ItemFulfillments`);

      // Filter out service items
      const inventoryChecks = await Promise.all(
        fulfillmentsArray.map(async (fulfillment) => ({
          ...fulfillment,
          isInventory: await isInventoryItem(fulfillment.itemId)
        }))
      );

      const inventoryFulfillments = inventoryChecks.filter(f => f.isInventory);

      if (inventoryFulfillments.length === 0) {
        console.warn('⚠️ All items are service items. Skipping inventory and cost updates.');
        return fulfillmentsArray.map(f => ({ skipped: true, reason: 'Service item', itemId: f.itemId }));
      }

      // Get all product data and calculate new costs
      const productUpdates = await Promise.all(
        inventoryFulfillments.map(async (fulfillment) => {
          const productUrl = buildUrl(`/product/${fulfillment.itemId}`);
          const productResponse = await fetch(productUrl, {
            method: 'GET',
            ...FETCH_OPTIONS
          });

          if (!productResponse.ok) {
            throw new Error(`Failed to fetch product ${fulfillment.itemId}. Status: ${productResponse.status}`);
          }

          const product = await productResponse.json();
          const currentAvgCost = Number(product.averageCost || 0);

          const inventoryDetail = await checkInventoryDetailExists(fulfillment.itemId, fulfillment.locationId);
          if (!inventoryDetail) {
            throw new Error(`Inventory detail not found for item ${fulfillment.itemId} at location ${fulfillment.locationId}`);
          }

          const currentAvailableQty = Number(inventoryDetail.quantityAvailable || 0);

          if (currentAvailableQty < fulfillment.fulfillmentQty) {
            throw new Error(`Insufficient inventory for item ${fulfillment.itemId}. Available: ${currentAvailableQty}, Requested: ${fulfillment.fulfillmentQty}`);
          }

          const costCalculation = calculateFulfillmentCost(currentAvgCost, currentAvailableQty, fulfillment.fulfillmentQty);
          const newQuantity = costCalculation.newQuantity;
          const newAvgCost = costCalculation.newAvgCost;

          return {
            fulfillment,
            currentAvgCost,
            currentAvailableQty,
            newQuantity,
            newAvgCost,
            costCalculation
          };
        })
      );

      // Bulk update inventory quantities
      const inventoryUpdates = productUpdates.map(update => ({
        itemId: update.fulfillment.itemId,
        locationId: update.fulfillment.locationId,
        quantity: update.newQuantity
      }));

      await bulkSetInventoryQuantity(inventoryUpdates);

      // Update product average costs (one by one as they're different products)
      await Promise.all(
        productUpdates.map(async (update) =>
          updateProductAverageCost(update.fulfillment.itemId, update.newAvgCost)
        )
      );

      console.log(`✅ Bulk ItemFulfillment processing complete for ${inventoryFulfillments.length} items`);

      return productUpdates.map(update => ({
        success: true,
        mode: 'create',
        itemId: update.fulfillment.itemId,
        inventory: {
          oldQuantity: update.currentAvailableQty,
          newQuantity: update.newQuantity
        },
        cost: {
          oldAvgCost: update.currentAvgCost,
          newAvgCost: update.newAvgCost,
          ...update.costCalculation
        }
      }));

    } catch (err) {
      console.error('❌ Error bulk processing ItemFulfillments:', err.message);
      throw err;
    }
  }, [isInventoryItem, checkInventoryDetailExists, calculateFulfillmentCost, bulkSetInventoryQuantity, updateProductAverageCost]);

  /**
   * Process ItemFulfillment inventory and cost updates
   * This handles: inventory reduction, average cost calculation, and product update
   *
   * NOTE: Only 'create' mode is supported for average cost calculation.
   * Edit and delete modes will throw an error.
   *
   * @param {string} itemId - The item ID
   * @param {string} locationId - The location ID
   * @param {number} fulfillmentQty - Quantity being fulfilled
   * @param {string} mode - Only 'create' is supported
   * @param {number} originalFulfillmentAvgCost - (Deprecated) Not used anymore
   * @returns {Promise<object>} Result with updated inventory and cost info
   */
  const processItemFulfillment = useCallback(async ({ itemId, locationId, fulfillmentQty, mode, originalFulfillmentAvgCost }) => {
    if (!itemId || !locationId || fulfillmentQty === undefined || fulfillmentQty === null) {
      throw new Error('itemId, locationId, and fulfillmentQty are required');
    }

    // Use bulk function with single item
    const results = await bulkProcessItemFulfillment([{ itemId, locationId, fulfillmentQty, mode }]);
    return results.length > 0 ? results[0] : null;
  }, [bulkProcessItemFulfillment]);

  // Return the hook's interface
  return {
    // Primary functions
    createOrUpdateInventoryDetail,
    setInventoryQuantity,
    getInventoryDetail,
    getQuantityAvailable,
    validateInventoryAvailability,
    processItemFulfillment,
    processItemReceipt,
    getProductStandardCost,
    getProductSalesPriceTaxCode,
    getProductPurchasePriceTaxCode,

    // Bulk operations (NEW - for better performance with multiple items)
    bulkSetInventoryQuantity,
    bulkProcessItemReceipt,
    bulkProcessItemFulfillment,
    bulkCreateInventoryDetails,
    bulkUpdateInventoryDetails,

    // Individual operations (for advanced use cases)
    createInventoryDetail,
    updateInventoryDetail,
    checkInventoryDetailExists,
    calculateFulfillmentCost,
    calculateAverageCost,
    reverseItemFulfillment,
    updateProductAverageCost,
    getTotalQuantityAllLocations,

    // State
    loading,
    error,

    // Utility to clear error state
    clearError: useCallback(() => setError(null), [])
  };
};

export default useInventoryDetail;

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage - adjust quantity (add/subtract)
 * const { createOrUpdateInventoryDetail, loading, error } = useInventoryDetail();
 * 
 * const handleAdjustInventory = async () => {
 *   try {
 *     const result = await createOrUpdateInventoryDetail({
 *       itemId: 'item-123',
 *       locationId: 'location-456',
 *       quantity: 50 // This will be added to existing quantity or set as initial
 *     });
 *     console.log('Inventory updated:', result);
 *   } catch (err) {
 *     console.error('Failed to update inventory:', err.message);
 *   }
 * };
 * 
 * // Set absolute quantity
 * const { setInventoryQuantity } = useInventoryDetail();
 * 
 * const handleSetQuantity = async () => {
 *   try {
 *     const result = await setInventoryQuantity({
 *       itemId: 'item-123',
 *       locationId: 'location-456',
 *       quantity: 100 // This will replace the existing quantity
 *     });
 *     console.log('Inventory set:', result);
 *   } catch (err) {
 *     console.error('Failed to set inventory:', err.message);
 *   }
 * };
 * 
 * // Check current inventory
 * const { getInventoryDetail } = useInventoryDetail();
 * 
 * const handleCheckInventory = async () => {
 *   try {
 *     const detail = await getInventoryDetail('item-123', 'location-456');
 *     if (detail) {
 *       console.log('Current quantity:', detail.quantity);
 *     } else {
 *       console.log('No inventory found for this item/location');
 *     }
 *   } catch (err) {
 *     console.error('Failed to check inventory:', err.message);
 *   }
 * };
 */
