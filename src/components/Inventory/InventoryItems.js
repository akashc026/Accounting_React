import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiConfig, buildUrl } from '../../config/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Field, FormElement, FieldArray } from '@progress/kendo-react-form';
import { Input, TextArea, NumericTextBox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { clone } from '@progress/kendo-react-common';
import { FaSave, FaTimes, FaPlus, FaTrash, FaEdit, FaCheck, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';
import { useDynamicForm } from '../../hooks/useDynamicForm';
import useInventoryDetail from '../../hooks/useInventoryDetail';
import '../../shared/styles/DynamicFormCSS.css';

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

// Create React Context for editing
const ItemGridEditContext = React.createContext({});
const ITEM_DATA_INDEX = 'itemDataIndex';
const DATA_ITEM_KEY = 'id';

const InventoryItems = React.memo(({ recordType, mode = 'new', embedded = false, selectedLocation, toLocation, selectedFormId }) => {
  console.log('DEBUG InventoryItems: Received selectedLocation prop:', selectedLocation);
  console.log('DEBUG InventoryItems: Received toLocation prop:', toLocation);
  const navigate = useNavigate();
  const { id } = useParams();

  const { loading: dynamicLoading, error: dynamicError, fetchFormConfiguration } = useDynamicForm();
  const { getQuantityAvailable, getProductStandardCost, createOrUpdateInventoryDetail } = useInventoryDetail();

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [dropdownData, setDropdownData] = useState({});
  const [formInitialized, setFormInitialized] = useState(false);

  // Transaction items navigation
  const navigationPaths = {
    InventoryAdjustment: '/inventory-adjustment',
    InventoryTransfer: '/inventory-transfer'
  };

  // Get transaction-specific item configurations
  const getItemConfiguration = useCallback((transactionType) => {
    switch (transactionType) {
      case 'InventoryAdjustment':
        return {
          title: 'Adjustment Items',
          fields: ['itemID', 'quantityInHand', 'quantityAdjusted', 'rate', 'totalAmount']
        };

      case 'InventoryTransfer':
        return {
          title: 'Transfer Items',
          fields: ['itemID', 'quantityInHand', 'quantityTransfer', 'rate', 'totalAmount']
        };

      default:
        return {
          title: 'Items',
          fields: ['itemID', 'quantityInHand', 'quantity', 'rate', 'totalAmount']
        };
    }
  }, []);

  const fetchDropdownData = useCallback(async (source, signal) => {
    try {
      const response = await fetch(buildUrl(source), {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        signal
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch dropdown data from ${source}`);
      }

      const data = await response.json();
      // Handle both new format (direct array) and old format (results property)
      return Array.isArray(data) ? data : (data.results || data || []);
    } catch (err) {
      if (err.name === 'AbortError') {
        return [];
      }
      return [];
    }
  }, []);

  const loadTransactionItems = useCallback(async (transactionId) => {
    // Define API endpoints for loading line items based on transaction type
    const transactionConfig = {
      InventoryAdjustment: {
        endpoint: buildUrl(apiConfig.endpoints.inventoryAdjustmentLineByAdjustment(transactionId)),
        idField: 'adjustmentId'
      },
      InventoryTransfer: {
        endpoint: buildUrl(apiConfig.endpoints.inventoryTransferLineByTransfer(transactionId)),
        idField: 'transferId'
      }
    };

    const config = transactionConfig[recordType];
    if (!config) {
      throw new Error(`Unsupported record type: ${recordType}`);
    }

    try {
      const response = await fetch(config.endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No items found, return empty array
          return [];
        }
        throw new Error(`Failed to load transaction items: ${response.status}`);
      }

      const data = await response.json();
      console.log('DEBUG: Raw API response:', data);
      console.log('DEBUG: Type of data:', typeof data);
      console.log('DEBUG: Is data array?', Array.isArray(data));
      console.log('DEBUG: data.results:', data.results);
      console.log('DEBUG: Type of data.results:', typeof data.results);
      console.log('DEBUG: Is data.results array?', Array.isArray(data.results));

      // Ensure items is always an array
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data && Array.isArray(data.results)) {
        items = data.results;
      } else if (data && typeof data === 'object') {
        // Check for arrays in object properties
        const possibleArrays = Object.values(data).filter(value => Array.isArray(value));
        if (possibleArrays.length > 0) {
          items = possibleArrays[0];
        }
      }

      console.log('DEBUG: Final items array:', items);
      console.log('DEBUG: Items length:', items.length);
      console.log('DEBUG: Is items array?', Array.isArray(items));

      // Transform API data to match form structure
      return items.map((item, index) => ({
        id: index + 1, // Use sequential IDs for form
        itemID: item.itemID || '',
        quantityInHand: item.quantityInHand || 0,
        quantityAdjusted: recordType === 'InventoryAdjustment' ? item.quantityAdjusted : undefined,
        quantityTransfer: recordType === 'InventoryTransfer' ? item.quantityTransfer : undefined,
        rate: item.rate || 0,
        totalAmount: item.totalAmount || 0,
        reason: item.reason || ''
      }));
    } catch (err) {
      console.error('Error loading transaction items:', err);
      throw err;
    }
  }, [recordType]);

  const initializeFormData = (itemConfig) => {
    // Create initial item based on transaction type
    const createInitialItem = () => {
      const baseItem = {
        id: 1,
        itemID: '',
        quantityInHand: 0,
        rate: 0,
        totalAmount: 0,
        reason: ''
      };

      if (recordType === 'InventoryAdjustment') {
        return {
          ...baseItem,
          quantityAdjusted: 0
        };
      } else if (recordType === 'InventoryTransfer') {
        return {
          ...baseItem,
          quantityTransfer: 0
        };
      }

      return baseItem;
    };

    const initialData = {
      transactionId: id || null,
      items: [] // Start with empty array - no initial items
    };
    return initialData;
  };

  useEffect(() => {
    let isMounted = true;

    const loadFormData = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);
        setFormInitialized(false);

        // Get item configuration for this transaction type
        const itemConfig = getItemConfiguration(recordType);
        setFormConfig(itemConfig);

        // Fetch dropdown data for required fields (products and reasons)
        const dropdownPromises = [
          fetchDropdownData('/product/item-type/ef765a67-402b-48ee-b898-8eaa45affb64').then(data => ({ name: 'itemID', data }))
        ];

        // Add reason dropdown if selectedFormId is available

        if (selectedFormId) {
          dropdownPromises.push(
            fetchDropdownData(`/form/${selectedFormId}`).then(data => ({ name: 'reason', data }))
          );
        }

        const dropdownResults = await Promise.all(dropdownPromises);
        console.log('dropdownResults', dropdownResults);
        if (!isMounted) return;

        const dropdownDataMap = dropdownResults.reduce((acc, { name, data }) => {
          acc[name] = data;
          return acc;
        }, {});

        setDropdownData(dropdownDataMap);

        // Initialize form data
        const initialFormData = initializeFormData(itemConfig);

        if (mode !== 'new' && id) {
          // Load existing transaction items
          try {
            const existingItems = await loadTransactionItems(id);
            if (existingItems && existingItems.length > 0) {
              initialFormData.items = existingItems;
            }
          } catch (err) {
            console.warn('Failed to load existing items:', err.message);
            // Continue with empty items array if loading fails
          }
        }

        if (!isMounted) return;
        setFormData(initialFormData);
        setFormInitialized(true);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message);
        showNotification(err.message, 'error');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadFormData();

    return () => {
      isMounted = false;
    };
  }, [mode, id, recordType, getItemConfiguration, fetchDropdownData, loadTransactionItems]);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  }, []);

  const calculateAmount = useCallback((quantity, rate) => {
    return (quantity || 0) * (rate || 0);
  }, []);

  const handleSubmit = async (formValues) => {
    try {
      setLoading(true);
      setError(null);

      // If embedded, don't save immediately - let parent form handle it
      if (embedded) {
        showNotification('Line items updated. Save the main form to create the transaction.', 'info');
        return;
      }

      // Get transaction ID from URL params
      const transactionId = id;
      if (!transactionId) {
        throw new Error('Transaction ID is required to save line items');
      }

      // Get line items from form data
      const lineItems = formValues.items || [];
      if (lineItems.length === 0) {
        showNotification('No items to save', 'warning');
        return;
      }

      // Define API endpoints and field mappings for each transaction type
      const transactionConfig = {
        InventoryAdjustment: {
          endpoint: buildUrl(apiConfig.endpoints.inventoryAdjustmentLine),
          idField: 'adjustmentId',
          quantityField: 'quantityAdjusted'
        },
        InventoryTransfer: {
          endpoint: buildUrl(apiConfig.endpoints.inventoryTransferLine),
          idField: 'transferId',
          quantityField: 'quantityTransfer'
        }
      };

      const config = transactionConfig[recordType];
      if (!config) {
        throw new Error(`Unsupported record type: ${recordType}`);
      }

      // Create line items one by one
      const lineCreationPromises = lineItems.map(async (line, index) => {
        const quantity = Number(line[config.quantityField] || 0);
        const rate = Number(line.rate || 0);
        const quantityInHand = Number(line.quantityInHand || 0);

        // Calculate amounts
        const totalAmount = quantity * rate;

        // Build line payload based on transaction type
        const linePayload = {
          [config.idField]: transactionId,
          itemID: line.itemID?.value || line.itemID,
          quantityInHand: quantityInHand,
          [config.quantityField]: quantity,
          rate: rate,
          totalAmount: totalAmount
        };

        const lineResponse = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(cleanPayload(linePayload))
        });

        if (!lineResponse.ok) {
          const errorData = await lineResponse.text();
          throw new Error(`Failed to create line ${index + 1}: ${lineResponse.status} - ${errorData}`);
        }

        return await lineResponse.json();
      });

      // Execute all line creation promises
      await Promise.all(lineCreationPromises);

      showNotification(`${recordType} items saved successfully (${lineItems.length} items)`, 'success');

      // Don't navigate if embedded
      if (!embedded) {
        navigate(navigationPaths[recordType] || '/');
      }
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  const getDropdownProps = useCallback((fieldName) => {
    const options = dropdownData[fieldName] || [];

    if (fieldName === 'reason') {
      // Handle reason dropdown data
      if (options.reasons) {
        try {
          const reasonData = JSON.parse(options.reasons);
          return reasonData.map(reason => ({
            text: reason.reason,
            value: reason.id + '$' + reason.accountId
          }));
        } catch (error) {
          console.error('Error parsing reason data:', error);
          return [];
        }
      }
      return [];
    }

    const transformedOptions = options.map(item => {
      if (typeof item === 'string') return { text: item, value: item };
      if (!item.id) return { text: String(item), value: item };

      const getDisplayText = (obj) => {
        // Handle special cases with formatted text for products
        if (fieldName === 'itemID' && obj.itemName && obj.itemCode) {
          return `${obj.itemCode} - ${obj.itemName}`;
        }

        // Priority fields for display
        const displayFields = ['name', 'itemName', 'productName', 'description', 'title'];
        for (const field of displayFields) {
          if (obj[field]) return obj[field];
        }

        return String(obj.id);
      };

      const displayText = getDisplayText(item);
      return { text: displayText, value: item.id, item: item };
    });

    return transformedOptions;
  }, [dropdownData]);

  // Memoize reason dropdown data to prevent recalculation
  const reasonDropdownData = useMemo(() => {
    const reasonOptions = dropdownData['reason'] || {};
    if (reasonOptions.reasons) {
      try {
        const reasonData = JSON.parse(reasonOptions.reasons);
        return reasonData.map(reason => ({
          text: reason.reason,
          value: reason.id + '$' + reason.accountId
        }));
      } catch (error) {
        console.error('Error parsing reason data:', error);
        return [];
      }
    }
    return [];
  }, [dropdownData]);

  const createFieldComponent = useCallback((Component, type = 'default') => (fieldRenderProps) => {
    const { validationMessage, visited, label, ...others } = fieldRenderProps;
    const showValidationMessage = visited && validationMessage;
    const commonProps = {
      ...others,
      className: showValidationMessage ? 'k-state-invalid' : '',
      style: { width: '100%' },
      disabled: mode === 'view' || others.disabled
    };

    const componentProps = {
      text: { component: Input, props: commonProps },
      number: { component: NumericTextBox, props: { ...commonProps, min: 0, step: 0 } },
      textarea: { component: TextArea, props: { ...commonProps, rows: 2 } },
      date: { component: DatePicker, props: commonProps },
      dropdown: { component: DropDownList, props: { ...commonProps, ...getDropdownProps(fieldRenderProps) } }
    };

    const config = componentProps[type] || componentProps.text;
    return (
      <div>
        <config.component {...config.props} />
        {showValidationMessage && <div className="k-form-error">{validationMessage}</div>}
      </div>
    );
  }, [mode, getDropdownProps]);

  const TotalAmountCell = React.memo((props) => {
    const { dataItem } = props;
    const quantityField = recordType === 'InventoryAdjustment' ? 'quantityAdjusted' : 'quantityTransfer';
    const quantity = parseFloat(dataItem[quantityField]) || 0;
    const rate = parseFloat(dataItem.rate) || 0;
    const calculatedAmount = quantity * rate;
    const totalAmount = dataItem.totalAmount || calculatedAmount;

    return (
      <td {...props.tdProps} style={{ textAlign: 'right', display: 'none' }}>
        <span style={{ padding: '8px', display: 'block', fontWeight: 'bold' }}>
          {totalAmount.toFixed(2)}
        </span>
      </td>
    );
  });

  // Grid cell components for items
  const ItemCell = (props) => {
    const { parentField, editIndex, validatedItems, onUpdateField } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;
    const shouldValidate = validatedItems.includes(props.dataItem[ITEM_DATA_INDEX]);

    if (isInEdit) {
      const productOptions = getDropdownProps('itemID');

      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <DropDownList
            data={productOptions}
            textField="text"
            dataItemKey="value"
            valueField="value"
            value={productOptions.find(p => p.value === props.dataItem[props.field]) || null}
            onChange={async (e) => {
              const selectedValue = e.target.value?.value || e.target.value;
              await onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, selectedValue);
            }}
            style={{ width: '100%' }}
          />
        </td>
      );
    }

    const fieldValue = props.dataItem[props.field];
    const productOptions = getDropdownProps('itemID');
    const product = productOptions.find(p => p.value === fieldValue);
    const productName = product?.text || '';

    return (
      <td {...props.tdProps}>
        <span style={{ padding: '8px', display: 'block' }}>
          {productName}
        </span>
      </td>
    );
  };

  const QuantityCell = (props) => {
    const { parentField, editIndex, onUpdateField } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;

    if (isInEdit) {
      // For inventory adjustments, allow negative values (adjustments can be positive or negative)
      // For other quantity fields, keep minimum at 0
      const isAdjustmentField = props.field === 'quantityAdjusted';

      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <Input
            type="number"
            min={isAdjustmentField ? undefined : "0"}
            step="1"
            value={props.dataItem[props.field] ?? ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              // Only allow integer values for quantity fields
              const newValue = inputValue === '' ? '' : parseInt(inputValue) || '';
              onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, newValue);
            }}
            onKeyDown={(e) => {
              // Prevent decimal point entry
              if (e.key === '.' || e.key === ',') {
                e.preventDefault();
              }
            }}
            style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '13px' }}
          />
        </td>
      );
    }

    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        <span style={{ padding: '8px', display: 'block' }}>
          {props.dataItem[props.field] || ''}
        </span>
      </td>
    );
  };

  const DisabledQuantityCell = (props) => {
    const { selectedLocation } = React.useContext(ItemGridEditContext);
    const [currentQuantity, setCurrentQuantity] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchQuantity = async () => {
        console.log('DEBUG DisabledQuantityCell: Checking conditions', {
          mode,
          itemID: props.dataItem?.itemID,
          selectedLocation,
          field: props.field
        });

        if ((mode === 'view' || mode === 'edit') && props.dataItem?.itemID && selectedLocation) {
          console.log('DEBUG DisabledQuantityCell: Fetching quantity for item', props.dataItem.itemID);
          setLoading(true);
          try {
            const locationId = selectedLocation?.value || selectedLocation;
            console.log('DEBUG DisabledQuantityCell: Calling getQuantityAvailable with', {
              itemID: props.dataItem.itemID,
              locationId
            });
            const quantity = await getQuantityAvailable(props.dataItem.itemID, locationId);
            console.log('DEBUG DisabledQuantityCell: Got quantity result:', quantity);
            setCurrentQuantity(quantity);
          } catch (err) {
            console.warn(`Failed to fetch quantity for item ${props.dataItem.itemID}:`, err.message);
            console.log('DEBUG DisabledQuantityCell: Using fallback value:', props.dataItem[props.field] || 0);
            setCurrentQuantity(props.dataItem[props.field] || 0);
          } finally {
            setLoading(false);
          }
        } else {
          console.log('DEBUG DisabledQuantityCell: Using original value:', props.dataItem[props.field] || 0);
          setCurrentQuantity(props.dataItem[props.field] || 0);
        }
      };

      fetchQuantity();
    }, [props.dataItem?.itemID, selectedLocation, mode]);

    const displayValue = loading ? '...' : (currentQuantity !== null ? currentQuantity : (props.dataItem[props.field] || '0'));

    return (
      <td {...props.tdProps} style={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>
        <span style={{ padding: '8px', display: 'block', color: '#666' }}>
          {displayValue}
        </span>
      </td>
    );
  };

  const RateCell = (props) => {
    const { parentField, editIndex, onUpdateField } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;

    if (isInEdit) {
      return (
        <td {...props.tdProps} style={{ padding: '0', display: 'none' }}>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={props.dataItem[props.field] ?? ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              const newValue = inputValue === '' ? '' : parseFloat(inputValue) || '';
              onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, newValue);
            }}
            style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '13px' }}
          />
        </td>
      );
    }

    const value = props.dataItem[props.field];
    const formattedValue = value !== null && value !== undefined && typeof value === 'number' ?
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value) :
      (value === 0 ? '0.00' : '');

    return (
      <td {...props.tdProps} style={{ textAlign: 'right', display: 'none' }}>
        <span style={{ padding: '8px', display: 'block' }}>
          {formattedValue}
        </span>
      </td>
    );
  };

  const ReasonCell = (props) => {
    const { parentField, editIndex, onUpdateField } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;

    if (isInEdit) {
      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <DropDownList
            data={reasonDropdownData}
            textField="text"
            dataItemKey="value"
            valueField="value"
            value={reasonDropdownData.find(r => r.value === props.dataItem[props.field]) || null}
            onChange={(e) => {
              const selectedValue = e.target.value?.value || e.target.value;
              onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, selectedValue);
            }}
            style={{ width: '100%' }}
          />
        </td>
      );
    }

    const fieldValue = props.dataItem[props.field];
    const reason = reasonDropdownData.find(r => r.value === fieldValue);
    const reasonText = reason?.text || '';

    return (
      <td {...props.tdProps}>
        <span style={{ padding: '8px', display: 'block' }}>
          {reasonText}
        </span>
      </td>
    );
  };

  const CommandCell = (props) => {
    const { onRemove, onEdit, onSave, onCancel, editIndex, validateItem } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;
    const isNewItem = !props.dataItem[DATA_ITEM_KEY] ||
      (!props.dataItem.itemID);

    const onRemoveClick = useCallback((e) => {
      e.preventDefault();
      onRemove(props.dataItem);
    }, [props.dataItem, onRemove]);

    const onEditClick = useCallback((e) => {
      e.preventDefault();
      onEdit(props.dataItem, isNewItem);
    }, [props.dataItem, onEdit, isNewItem]);

    const onSaveClick = useCallback((e) => {
      e.preventDefault();
      onSave(props.dataItem);
    }, [onSave, props.dataItem]);

    const onCancelClick = useCallback((e) => {
      e.preventDefault();
      onCancel();
    }, [onCancel]);

    return isInEdit ? (
      <td {...props.tdProps} className="k-command-cell" style={{ padding: '4px', whiteSpace: 'nowrap' }}>
        <Button
          type="button"
          onClick={onSaveClick}
          className="k-grid-save-command"
          size="small"
          style={{
            marginRight: '4px',
            backgroundColor: '#4CAF50',
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px'
          }}
          title={isNewItem ? 'Add this item when complete' : 'Save changes to this item'}
          disabled={mode === 'view'}
        >
          {isNewItem ? 'Add' : 'Save'}
        </Button>
        <Button
          type="button"
          onClick={isNewItem ? onRemoveClick : onCancelClick}
          className="k-grid-cancel-command"
          size="small"
          style={{
            fontSize: '12px',
            padding: '4px 8px'
          }}
          title={isNewItem ? 'Remove this item' : 'Cancel editing'}
          disabled={mode === 'view'}
        >
          {isNewItem ? 'Discard' : 'Cancel'}
        </Button>
      </td>
    ) : (
      <td {...props.tdProps} className="k-command-cell" style={{ padding: '4px', whiteSpace: 'nowrap' }}>
        {mode !== 'view' && (
          <>
            <Button
              type="button"
              themeColor={'primary'}
              onClick={onEditClick}
              className="k-grid-edit-command"
              size="small"
              style={{
                marginRight: '4px',
                fontSize: '12px',
                padding: '4px 8px'
              }}
            >
              Edit
            </Button>
            <Button
              type="button"
              onClick={onRemoveClick}
              className="k-grid-remove-command"
              size="small"
              style={{
                fontSize: '12px',
                padding: '4px 8px'
              }}
            >
              Remove
            </Button>
          </>
        )}
      </td>
    );
  };

  // Items Grid Component
  const InventoryItemsGrid = (fieldArrayRenderProps) => {
    const { validationMessage, visited, name, dataItemKey } = fieldArrayRenderProps;
    const [editIndex, setEditIndex] = useState(undefined);
    const editItemCloneRef = React.useRef(undefined);
    const [validatedItems, setValidatedItems] = useState([]);

    // Function to validate a specific item
    const validateItem = useCallback((index) => {
      if (index !== undefined && fieldArrayRenderProps.value[index]) {
        setValidatedItems(prev => {
          if (!prev.includes(index)) {
            return [...prev, index];
          }
          return prev;
        });

        const item = fieldArrayRenderProps.value[index];
        const isValid = item.itemID && item.itemID !== null;

        return isValid;
      }
      return false;
    }, [fieldArrayRenderProps.value]);

    const onUpdateField = useCallback(async (index, fieldName, value) => {
      const currentItem = fieldArrayRenderProps.value[index];
      const updatedItem = {
        ...currentItem,
        [fieldName]: value
      };

      // When item is selected, check for duplicates and automatically fetch quantity/cost
      if (fieldName === 'itemID' && value && selectedLocation) {
        // Check for duplicate items
        const currentItems = fieldArrayRenderProps.value || [];
        const duplicateIndex = currentItems.findIndex((item, idx) =>
          idx !== index && item.itemID === value
        );

        if (duplicateIndex !== -1) {
          alert('This item has already been added to the list. Please select a different item.');
          // Clear the item selection
          updatedItem.itemID = '';
          fieldArrayRenderProps.onReplace({
            index: index,
            value: updatedItem
          });
          return;
        }

        try {
          // Fetch quantity available
          const quantityAvailable = await getQuantityAvailable(value, selectedLocation);
          updatedItem.quantityInHand = quantityAvailable;

          // Fetch standard cost and set to rate field
          const standardCost = await getProductStandardCost(value);
          updatedItem.rate = standardCost;
        } catch (error) {
          console.error('Failed to fetch quantity available or standard cost:', error);
          updatedItem.quantityInHand = 0;
          updatedItem.rate = 0;
        }
      }

      // Auto-calculate totalAmount when quantity or rate changes
      const quantityField = recordType === 'InventoryAdjustment' ? 'quantityAdjusted' : 'quantityTransfer';
      if (fieldName === quantityField || fieldName === 'rate') {
        const quantity = fieldName === quantityField ? value : (updatedItem[quantityField] || 0);
        const rate = fieldName === 'rate' ? value : (updatedItem.rate || 0);
        updatedItem.totalAmount = (parseFloat(quantity) || 0) * (parseFloat(rate) || 0);
      }

      fieldArrayRenderProps.onReplace({
        index: index,
        value: updatedItem
      });
    }, [fieldArrayRenderProps, recordType, getQuantityAvailable, getProductStandardCost, selectedLocation]);

    // Calculate initial totals
    const calculateTotals = (items) => {
      if (!items || !Array.isArray(items)) {
        return { totalAmount: 0, totalQuantity: 0 };
      }
      const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      const quantityField = recordType === 'InventoryAdjustment' ? 'quantityAdjusted' : 'quantityTransfer';
      const totalQuantity = items.reduce((sum, item) => sum + (item[quantityField] || 0), 0);
      return { totalAmount, totalQuantity };
    };

    // State-based totals that only update on button actions
    const [totals, setTotals] = useState(() => calculateTotals(fieldArrayRenderProps.value));

    // Function to update totals - only called on button actions
    const updateTotals = useCallback(() => {
      const newTotals = calculateTotals(fieldArrayRenderProps.value);
      setTotals(newTotals);
    }, [fieldArrayRenderProps.value, recordType]);

    // Add a new item
    const onAdd = useCallback((e) => {
      e.preventDefault();

      if (editIndex !== undefined || mode === 'view') {
        return;
      }

      // Check for existing empty items and edit them instead
      const currentItems = fieldArrayRenderProps.value || [];
      const emptyItemIndex = currentItems.findIndex(item => !item.itemID);
      if (emptyItemIndex !== -1) {
        setEditIndex(emptyItemIndex);
        return;
      }

      const newItemId = currentItems.length > 0
        ? Math.max(...currentItems.map(item => parseInt(item.id) || 0)) + 1
        : 1;

      // Create new item with exact structure matching form type
      const newItem = {
        id: newItemId,
        itemID: '',
        quantityInHand: 0,
        rate: 0,
        totalAmount: 0,
        reason: ''
      };

      if (recordType === 'InventoryAdjustment') {
        newItem.quantityAdjusted = 0;
      } else if (recordType === 'InventoryTransfer') {
        newItem.quantityTransfer = 0;
      }

      fieldArrayRenderProps.onUnshift({ value: newItem });
      setEditIndex(0);
      // Update totals after adding item
      setTimeout(() => updateTotals(), 0);
    }, [fieldArrayRenderProps, editIndex, recordType, mode, updateTotals]);

    const onRemove = useCallback((dataItem) => {
      fieldArrayRenderProps.onRemove({
        index: dataItem[ITEM_DATA_INDEX]
      });
      setEditIndex(undefined);
      editItemCloneRef.current = undefined;
      // Update totals after removing item
      setTimeout(() => updateTotals(), 0);
    }, [fieldArrayRenderProps, updateTotals]);

    const onEdit = useCallback((dataItem) => {
      editItemCloneRef.current = clone(dataItem);
      setEditIndex(dataItem[ITEM_DATA_INDEX]);
    }, []);

    const onCancel = useCallback(() => {
      if (editItemCloneRef.current) {
        fieldArrayRenderProps.onReplace({
          index: editItemCloneRef.current[ITEM_DATA_INDEX],
          value: editItemCloneRef.current
        });
      }
      editItemCloneRef.current = undefined;
      setEditIndex(undefined);
      // Update totals after canceling (reverting changes)
      setTimeout(() => updateTotals(), 0);
    }, [fieldArrayRenderProps, updateTotals]);

    const onSave = useCallback((dataItem) => {
      const index = dataItem[ITEM_DATA_INDEX];
      const currentItem = fieldArrayRenderProps.value[index];

      // Basic validation
      if (!currentItem.itemID) {
        alert('Product is required');
        return;
      }

      const quantityField = recordType === 'InventoryAdjustment' ? 'quantityAdjusted' : 'quantityTransfer';
      // For inventory adjustments, allow negative values; for transfers, require positive values
      const isAdjustment = recordType === 'InventoryAdjustment';
      if (!currentItem[quantityField] ||
        (!isAdjustment && currentItem[quantityField] <= 0) ||
        (isAdjustment && currentItem[quantityField] === 0)) {
        const message = isAdjustment ? 'Quantity adjusted cannot be zero' : 'Quantity must be greater than 0';
        alert(message);
        return;
      }

      // For Inventory Transfer only: Check if Qty in Hand is zero or negative
      if (recordType === 'InventoryTransfer') {
        const qtyInHand = Number(currentItem.quantityInHand || 0);
        const qtyTransfer = Number(currentItem.quantityTransfer || 0);

        if (qtyInHand <= 0) {
          alert('Cannot save item. Quantity In Hand is zero or negative, Please adjust the item quantity first!!');
          return;
        }

        // Check if Qty Transfer exceeds Qty In Hand
        if (qtyTransfer > qtyInHand) {
          alert(`Cannot save item. Quantity Transfer (${qtyTransfer}) cannot be greater than Quantity In Hand (${qtyInHand}).`);
          return;
        }
      }

      // For Inventory Adjustment: Check if adjustment would result in negative inventory
      if (recordType === 'InventoryAdjustment') {
        const qtyInHand = Number(currentItem.quantityInHand || 0);
        const qtyAdjusted = Number(currentItem.quantityAdjusted || 0);
        const newQuantity = qtyInHand + qtyAdjusted;

        if (newQuantity < 0) {
          alert(`Cannot save item. Adjustment of ${qtyAdjusted} would result in negative inventory (Current: ${qtyInHand}, New: ${newQuantity}). Please enter a valid adjustment quantity.`);
          return;
        }
      }

      // Perform final calculations before saving
      const quantity = currentItem[quantityField] === '' ? 0 : parseFloat(currentItem[quantityField]) || 0;
      const rate = currentItem.rate === '' ? 0 : parseFloat(currentItem.rate) || 0;
      const totalAmount = Math.round((quantity * rate) * 100) / 100;

      // Update the item with calculated values
      fieldArrayRenderProps.onReplace({
        index: index,
        value: {
          ...currentItem,
          totalAmount: totalAmount
        }
      });

      setEditIndex(undefined);
      editItemCloneRef.current = undefined;
      setEditIndex(undefined);
      // Update totals after saving item
      setTimeout(() => updateTotals(), 0);
    }, [fieldArrayRenderProps, recordType, updateTotals]);

    // Calculate amounts when values change
    React.useEffect(() => {
      if (editIndex !== undefined && fieldArrayRenderProps.value[editIndex]) {
        const currentItem = fieldArrayRenderProps.value[editIndex];
        const quantityField = recordType === 'InventoryAdjustment' ? 'quantityAdjusted' : 'quantityTransfer';
        const quantity = currentItem[quantityField] === '' ? 0 : parseFloat(currentItem[quantityField]) || 0;
        const rate = currentItem.rate === '' ? 0 : parseFloat(currentItem.rate) || 0;

        const totalAmount = quantity * rate;

        // Only update if calculations actually changed
        const roundedTotalAmount = Math.round(totalAmount * 100) / 100;
        const currentTotalAmount = Math.round((parseFloat(currentItem.totalAmount) || 0) * 100) / 100;

        if (roundedTotalAmount !== currentTotalAmount) {
          fieldArrayRenderProps.onReplace({
            index: editIndex,
            value: {
              ...currentItem,
              totalAmount: roundedTotalAmount
            }
          });
        }
      }
    }, [editIndex, fieldArrayRenderProps.value, recordType]);

    const dataWithIndexes = (fieldArrayRenderProps.value || []).map((item, index) => {
      return {
        ...item,
        [ITEM_DATA_INDEX]: index
      };
    });

    const rowRender = (trElement) => {
      const trProps = {
        ...trElement.props,
        style: {
          ...trElement.props.style,
          borderBottom: '1px solid #e0e0e0'
        }
      };
      return React.cloneElement(trElement, { ...trProps }, trElement.props.children);
    };

    return (
      <ItemGridEditContext.Provider value={{
        onCancel,
        onEdit,
        onRemove,
        onSave,
        onUpdateField,
        editIndex,
        parentField: name,
        validatedItems,
        validateItem,
        selectedLocation,
        toLocation
      }}>

        {visited && validationMessage && (
          <div className="k-form-error" style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
            {validationMessage}
          </div>
        )}

        {mode !== 'view' && (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingLeft: '8px', paddingRight: '8px' }}>
            <Button
              onClick={onAdd}
              themeColor="success"
              fillMode="solid"
              size="medium"
              className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success"
            >
              <FaPlus style={{ marginRight: '6px' }} /> Add Item
            </Button>
          </div>
        )}

        <div className="transaction-items-grid-container" style={{
          overflowX: 'auto',
          overflowY: 'visible',
          width: '100%',
          maxWidth: '100%'
        }}>
          <Grid
            className="transaction-items-grid"
            data={dataWithIndexes}
            dataItemKey={dataItemKey}
            rowRender={rowRender}
            style={{ minWidth: '800px' }}
          >
            <GridColumn field="itemID" title="Item" cells={{ data: ItemCell }} />
            <GridColumn field="quantityInHand" title="Qty In Hand" cells={{ data: DisabledQuantityCell }} />
            <GridColumn
              field={recordType === 'InventoryAdjustment' ? "quantityAdjusted" : "quantityTransfer"}
              title={recordType === 'InventoryAdjustment' ? "Qty Adjusted" : "Qty Transfer"}
              cells={{ data: QuantityCell }}
            />
            <GridColumn field="reason" title="Reason" cells={{ data: ReasonCell }} />
            {mode !== 'view' && <GridColumn cells={{ data: CommandCell }} />}
          </Grid>
        </div>
      </ItemGridEditContext.Provider>
    );
  };

  const validator = useCallback((values) => {
    const errors = {};

    if (!values.items || values.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      const itemErrors = values.items.map((item, index) => {
        const itemError = {};
        if (!item.itemID) {
          itemError.itemID = 'Product is required';
        }
        const quantityField = recordType === 'InventoryAdjustment' ? 'quantityAdjusted' : 'quantityTransfer';
        // For inventory adjustments, allow negative values; for transfers, require positive values
        const isAdjustment = recordType === 'InventoryAdjustment';
        if (!item[quantityField] ||
          (!isAdjustment && item[quantityField] <= 0) ||
          (isAdjustment && item[quantityField] === 0)) {
          const message = isAdjustment ? 'Quantity adjusted cannot be zero' : 'Quantity must be greater than 0';
          itemError[quantityField] = message;
        }

        // For Inventory Transfer only: Check if Qty in Hand is zero or negative
        if (recordType === 'InventoryTransfer') {
          const qtyInHand = Number(item.quantityInHand || 0);
          const qtyTransfer = Number(item.quantityTransfer || 0);

          if (qtyInHand <= 0) {
            itemError.quantityInHand = 'Quantity In Hand is zero or negative, Please adjust the item quantity first!!';
          }

          // Check if Qty Transfer exceeds Qty In Hand
          if (qtyTransfer > qtyInHand) {
            itemError.quantityTransfer = `Quantity Transfer (${qtyTransfer}) cannot be greater than Quantity In Hand (${qtyInHand})`;
          }
        }

        return Object.keys(itemError).length > 0 ? itemError : null;
      }).filter(Boolean);

      if (itemErrors.length > 0) {
        errors.items = 'Please fix item validation errors';
      }
    }

    return errors;
  }, [recordType]);

  if (loading || dynamicLoading || !formConfig || !formInitialized) {
    return (
      <div className="form-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <div>Loading {recordType.toLowerCase()} items...</div>
        </div>
      </div>
    );
  }

  if (error || dynamicError) {
    return (
      <div className="form-container">
        <div className="error-message">
          <h3>Error Loading {recordType} Items</h3>
          <p>{error || dynamicError}</p>
          <Button onClick={() => navigate(navigationPaths[recordType] || '/')}>
            Back to {recordType} List
          </Button>
        </div>
      </div>
    );
  }

  // If embedded, return just the FieldArray component to integrate with parent form
  if (embedded) {
    return (
      <div style={{ width: '100%' }}>
        <Fade>
          {notification.show && (
            <div className="notification-container">
              <Notification
                type={{ style: notification.type, icon: true }}
                closable={true}
                onClose={() => setNotification({ show: false, message: '', type: 'success' })}
              >
                <span>{notification.message}</span>
              </Notification>
            </div>
          )}
        </Fade>

        <FieldArray
          name="items"
          component={InventoryItemsGrid}
          dataItemKey={DATA_ITEM_KEY}
          validator={(value) => value && value.length ? '' : 'Please add at least one item'}
        />
      </div>
    );
  }

  return (
    <div className="form-container">
      <Fade>
        {notification.show && (
          <div className="notification-container">
            <Notification
              type={{ style: notification.type, icon: true }}
              closable={true}
              onClose={() => setNotification({ show: false, message: '', type: 'success' })}
            >
              <span>{notification.message}</span>
            </Notification>
          </div>
        )}
      </Fade>

      <div className="form-header">
        <h2>
          {mode === 'new' ? `Add ${formConfig.title}` :
            mode === 'edit' ? `Edit ${formConfig.title}` : `View ${formConfig.title}`}
        </h2>
      </div>

      <Form
        key={`${recordType.toLowerCase()}-items-form-${mode}-${id || 'new'}`}
        initialValues={formData}
        validator={validator}
        onSubmit={handleSubmit}
        render={(formRenderProps) => (
          <FormElement>
            <div className="form-grid">
              <div className="order-items-field">
                <FieldArray
                  name="items"
                  component={InventoryItemsGrid}
                  dataItemKey={DATA_ITEM_KEY}
                  validator={(value) => value && value.length ? '' : 'Please add at least one item'}
                />
              </div>
            </div>

            <div className="form-actions">
              <Button
                type="button"
                onClick={() => navigate(navigationPaths[recordType] || '/')}
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
              >
                <FaTimes /> {mode === 'view' ? 'Close' : 'Cancel'}
              </Button>
              {mode !== 'view' && (
                <Button
                  type="submit"
                  disabled={loading || !formRenderProps.allowSubmit}
                  className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
                >
                  <FaSave /> {loading ? 'Saving...' : 'Save Items'}
                </Button>
              )}
            </div>
          </FormElement>
        )}
      />

      <style>{`
        .form-container {
          background: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 16px;
          margin: 16px;
        }

        .form-header {
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .form-header h2 {
          margin: 0;
          color: #2d3748;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .order-items-field {
          grid-column: span 3;
          margin-top: 16px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 16px;
          margin-top: 8px;
          border-top: 1px solid #e2e8f0;
        }

        .notification-container {
          position: fixed;
          right: 12px;
          top: 12px;
          z-index: 9999;
          min-width: 280px;
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 150px;
          gap: 12px;
          font-size: 14px;
        }

        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .transaction-items-grid-container {
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow-x: auto !important;
          overflow-y: visible !important;
          margin-bottom: 16px;
          width: 100% !important;
          max-width: 100% !important;
        }

        .transaction-items-grid {
          border: none !important;
          border-radius: 0 !important;
          margin-bottom: 0 !important;
          min-width: 800px !important;
          width: auto !important;
        }

        .transaction-items-grid .k-grid-header {
          background: #f8fafc !important;
          border-bottom: 2px solid #e2e8f0 !important;
        }

        .transaction-items-grid .k-grid-header th {
          font-weight: 600 !important;
          color: #4a5568 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.5px !important;
          padding: 12px 8px !important;
          text-align: left !important;
        }

        .transaction-items-grid td {
          padding: 8px !important;
          border-bottom: 1px solid #f0f0f0 !important;
          vertical-align: middle !important;
        }

        .transaction-items-grid .k-grid-content tr:hover {
          background-color: #f7fafc !important;
        }
      `}</style>
    </div>
  );
});

export const InventoryAdjustmentItems = (props) => <InventoryItems {...props} recordType="InventoryAdjustment" />;
export const InventoryTransferItems = (props) => <InventoryItems {...props} recordType="InventoryTransfer" />;

export default InventoryItems;
