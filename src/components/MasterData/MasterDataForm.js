import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Field, FormElement } from '@progress/kendo-react-form';
import { Input, TextArea, NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import ConfirmDialog from '../shared/ConfirmDialog';
import { FaSave, FaTimes, FaTrash, FaBoxes, FaClipboardList, FaEdit } from 'react-icons/fa';
import { useCustomers, useVendors, useLocations, useChartOfAccount, useProducts, useTaxes } from '../../hooks/useMasterData';
import { useDynamicForm } from '../../hooks/useDynamicForm';
import { apiConfig, buildUrl } from '../../config/api';
import '../../shared/styles/DynamicFormCSS.css';

// Tab styles for Product form
const tabStyles = `
  .product-tabs {
    display: flex;
    border-bottom: 2px solid #e0e0e0;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px 8px 0 0;
    padding: 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .product-tab {
    flex: 1;
    padding: 16px 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: #6c757d;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: relative;
    border-radius: 8px 8px 0 0;
  }
  
  .product-tab:hover {
    background: rgba(255,255,255,0.7);
    color: #495057;
    transform: translateY(-1px);
  }
  
  .product-tab.active {
    background: linear-gradient(135deg,  #3b82f6 0%, #3b82f6 100%);
    color: white;
    box-shadow: 0 4px 8px rgba(217,131,65,0.3);
  }
  
  .product-tab.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;    background: #007bff;

  }
  
  .tab-content {
    background: white;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  
  .inventory-section {
    padding: 0 32px 32px 32px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 12px;
    margin: 0 16px 16px 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  
  .inventory-section h3 {
    color: #2c3e50;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .inventory-section h3::before {
    content: '📦';
    font-size: 28px;
  }
  
  .inventory-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    border-radius: 16px;
    overflow: hidden;
    background: white;
    border: 1px solid #e3f2fd;
  }
  
  .inventory-table th {
    background: linear-gradient(135deg,  #3b82f6 0%, #3b82f6 100%);
    color: white;
    padding: 18px 24px;
    text-align: left;
    font-weight: 700;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: relative;
    border: none;
  }
  
  .inventory-table th:first-child {
    border-radius: 16px 0 0 0;
  }
  
  .inventory-table th:last-child {
    border-radius: 0 16px 0 0;
  }
  
  .inventory-table th::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.3) 100%);
  }
  
  .inventory-table td {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f4f8;
    font-size: 15px;
    color: #37474f;
    font-weight: 500;
    transition: all 0.3s ease;
    position: relative;
  }
  
  .inventory-table tbody tr {
    transition: all 0.3s ease;
    background: white;
  }
  
  .inventory-table tbody tr:nth-child(even) {
    background: #fafbfc;
  }
  
  .inventory-table tbody tr:hover {
    background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(142,124,195,0.15);
  }
  
  .inventory-table tbody tr:hover td {
    color: #7b68c4;
  }
  
  .inventory-table tbody tr:last-child td {
    border-bottom: none;
  }
  
  .inventory-table tbody tr:last-child td:first-child {
    border-radius: 0 0 0 16px;
  }
  
  .inventory-table tbody tr:last-child td:last-child {
    border-radius: 0 0 16px 0;
  }
  
  .inventory-table td:nth-child(1) {
    font-weight: 600;
    color: #2c3e50;
  }
  
  .inventory-table td:nth-child(2) {
    color: #546e7a;
    font-style: italic;
  }
  
  .inventory-table td:nth-child(3) {
    font-weight: 700;
    color: #2e7d32;
    text-align: center;
    font-size: 16px;
  }
  
  .inventory-table td:nth-child(3)::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #4caf50;
    border-radius: 50%;
    margin-right: 8px;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  
  .inventory-empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #78909c;
    font-size: 16px;
    font-style: italic;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('product-tab-styles')) {
  const style = document.createElement('style');
  style.id = 'product-tab-styles';
  style.textContent = tabStyles;
  document.head.appendChild(style);
}

// Inventory Tab Component for Product
const InventoryTab = ({ formRenderProps, mode }) => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get the current item ID from form data
  const itemId = formRenderProps?.valueGetter('id');
  
  // Fetch inventory details when itemId changes
  useEffect(() => {
    const fetchInventoryDetails = async () => {
      if (!itemId) {
        setInventoryData([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(buildUrl(`/inventory-detail?ItemId=${itemId}`));
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        // Handle both new format (direct array) and old format (results property)
        const apiData = Array.isArray(data) ? data : (data.results || []);

        // Transform API response to match table structure
        const transformedData = apiData.map(item => ({
          id: item.id,
          locationId: item.locationId,
          location: item.locationName,
          availableQty: item.quantityAvailable
        }));
        
        setInventoryData(transformedData);
      } catch (err) {
        setError(err.message);
        setInventoryData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventoryDetails();
  }, [itemId]);

  return (
    <div className="inventory-section">
      {loading && (
        <div className="loading-message">
          Loading inventory data...
        </div>
      )}
      
      {error && (
        <div className="error-message">
          Error loading inventory: {error}
        </div>
      )}
      
      {!loading && !error && (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Available QTY</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.length > 0 ? (
              inventoryData.map((item) => (
                <tr key={item.id}>
                  <td>{item.location}</td>
                  <td>{item.availableQty}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="no-data">
                  {itemId ? 'No inventory data found for this item' : 'Please save the item first to view inventory details'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

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

const MasterDataForm = React.memo(({ recordType, mode = 'new' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Call all hooks at the top level
  const customerHooks = useCustomers();
  const vendorHooks = useVendors();
  const locationHooks = useLocations();
  const chartOfAccountHooks = useChartOfAccount();
  const productHooks = useProducts();
  const taxHooks = useTaxes();
  
  // Select appropriate hooks using useMemo
  const hooks = useMemo(() => {
    const hookMap = {
      Customer: customerHooks,
      Vendor: vendorHooks,
      Location: locationHooks,
      ChartOfAccount: chartOfAccountHooks,
      Product: productHooks,
      Tax: taxHooks
    };
    return hookMap[recordType] || hookMap.Customer;
  }, [recordType, customerHooks, vendorHooks, locationHooks, chartOfAccountHooks, productHooks, taxHooks]);

  const methodMap = useMemo(() => {
    const entityMap = {
      Customer: 'Customer', Vendor: 'Vendor', Location: 'Location',
       ChartOfAccount: 'ChartOfAccount', Product: 'Product', Tax: 'Tax'
    };
    const entity = entityMap[recordType] || 'Customer';
    return {
      fetch: hooks[`fetch${entity}ById`],
      create: hooks[`create${entity}`],
      update: hooks[`update${entity}`],
      delete: hooks[`delete${entity}`]
    };
  }, [hooks, recordType]);

  const { loading: dynamicLoading, error: dynamicError, fetchFormConfiguration } = useDynamicForm();

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [dropdownData, setDropdownData] = useState({});
  const [customFormFields, setCustomFormFields] = useState([]);
  const [customFormData, setCustomFormData] = useState({});
  const [customFieldValueIds, setCustomFieldValueIds] = useState({});
  const [originalCustomFormData, setOriginalCustomFormData] = useState({});
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [recordTypes, setRecordTypes] = useState([]);

  const [formInitialized, setFormInitialized] = useState(false);
  
  // Tab state for Product form only
  const [activeTab, setActiveTab] = useState('general');
  
  // Refs for cleanup
  const notificationTimerRef = React.useRef(null);

  const navigationPaths = {
    Customer: '/customer', Vendor: '/vendor', Location: '/location',
    ChartOfAccount: '/chart-of-account', Product: '/product', Tax: '/tax'
  };

  

  // Helper functions for dynamic account number generation (as provided by user)
  const fetchChildAccounts = useCallback(async (parentNumber) => {
    const url = buildUrl(apiConfig.endpoints.chartOfAccountByParentNumber(parentNumber));
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch child accounts for parent ${parentNumber}`);
    }

    return await response.json(); // returns child account objects
  }, []);

  const generateNextAccountNumber = useCallback((parentNumber, childAccounts) => {
    let step = 1;

    if (childAccounts.length === 0) {
      const parentLast2 = parentNumber.slice(-2);
      step = parentLast2 === "00" ? 1 : 100;
    } else {
      const diffs = childAccounts.map(acc => parseInt(acc.number || acc.accountNumber) - parseInt(parentNumber));
      const likelyStep = diffs.length > 0 ? Math.min(...diffs.filter(d => d > 0)) : 1;
      step = likelyStep >= 100 ? 100 : 1;
    }

    const maxChild = childAccounts.reduce((max, acc) => {
      const num = parseInt(acc.number || acc.accountNumber);
      return num > max ? num : max;
    }, parseInt(parentNumber));

    return (maxChild + step).toString();
  }, []);

  // Generate account number logic for ChartOfAccount - dynamic based on parent and children
  const generateAccNum = useCallback(async (parentId, isParent) => {
    try {
      // If this is a parent account, return null (manual entry required)
      if (isParent) {
        return null;
      }
      
      // If no parent selected, return null
      if (!parentId) {
        return null;
      }
      
      // Find the selected parent account to get its account number
      const parentOptions = dropdownData['parent'] || [];
      const selectedParent = parentOptions.find(option => option.id === parentId);
      
      if (!selectedParent || !selectedParent.accountNumber) {
        return null;
      }

      const parentNumber = selectedParent.accountNumber;
      
      // Fetch child accounts of the selected parent
      const childAccounts = await fetchChildAccounts(parentNumber);
      
      // Generate next account number using dynamic logic
      const nextAccountNumber = generateNextAccountNumber(parentNumber, childAccounts);
      
      return nextAccountNumber;
      
    } catch (error) {
      return null;
    }
  }, [dropdownData, fetchChildAccounts, generateNextAccountNumber]);

  // Handle field changes for ChartOfAccount
  const handleChartOfAccountFieldChange = useCallback((fieldName, value, formRenderProps) => {
    if (recordType !== 'ChartOfAccount' || !formRenderProps) {
      return;
    }

    if (fieldName === 'isParent') {
      if (value === true) {
        // When isParent becomes true, clear accountNumber and parent fields
        formRenderProps.onChange('accountNumber', { value: '' });
        formRenderProps.onChange('parent', { value: '' });
      }
    } else if (fieldName === 'parent') {
      const isParentValue = formRenderProps.valueGetter('isParent');
      
      if (value && !isParentValue) {
        // When parent is selected and isParent is false, generate account number
        generateAccNum(value, isParentValue).then(accountNumber => {
          if (accountNumber) {
            formRenderProps.onChange('accountNumber', { value: accountNumber });
          }
        }).catch(error => {
          // Silent error handling
        });
      }
    }
  }, [recordType, generateAccNum]);

  

  const fetchDropdownData = useCallback(async (source, signal) => {
    try {
      const response = await fetch(buildUrl(source), {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        signal
      });
      if (!response.ok) throw new Error(`Failed to fetch dropdown data: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : (data.results || data.data || []);
    } catch (err) {
      if (err.name === 'AbortError') {
        return [];
      }
      return [];
    }
  }, []);

  const fetchRecordTypes = useCallback(async (signal) => {
    try {
      const response = await fetch(buildUrl(apiConfig.endpoints.recordType), {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        signal
      });
      if (!response.ok) throw new Error(`Failed to fetch record types: ${response.status}`);
      const data = await response.json();
      // Handle both new format (direct array) and old format (results property)
      return Array.isArray(data) ? data : (data.results || []);
    } catch (err) {
      if (err.name === 'AbortError') {
        return [];
      }
      return [];
    }
  }, []);

  const fetchCustomFormFields = async (formId) => {
    try {
      const response = await fetch(buildUrl(apiConfig.endpoints.customFormFieldByForm(formId)), {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`Failed to fetch custom form fields: ${response.status}`);
      const data = await response.json();
      const fields = Array.isArray(data) ? data : [];
      const sortedFields = fields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      
      const customDropdownData = {};
      const dropdownFields = sortedFields.filter(field => 
        ['DropDownList', 'MultiSelect'].includes(field.fieldTypeName) && field.fieldSource
      );
      
      for (const field of dropdownFields) {
        const options = await fetchDropdownData(field.fieldSource);
        customDropdownData[`custom_${field.fieldName}`] = options;
      }

      if (Object.keys(customDropdownData).length > 0) {
        setDropdownData(prev => ({ ...prev, ...customDropdownData }));
      }
      
      return sortedFields;
    } catch (err) {
      showNotification(`Failed to load custom form fields: ${err.message}`, 'error');
      return [];
    }
  };

  const fetchCustomFieldValues = async (recordId, typeOfRecordId, customFields = []) => {
    try {
      if (!typeOfRecordId) {
        return {};
      }

      const response = await fetch(`${apiConfig.baseURL}/custom-field-value/by-type-and-record?typeOfRecord=${typeOfRecordId}&recordId=${recordId}`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        return {};
      }
      
      const customFieldValues = await response.json();
      const customData = {};
      const customFieldIds = {};
      
      // Create a map of field names to field types for type conversion
      const fieldTypeMap = {};
      customFields.forEach(field => {
        fieldTypeMap[field.fieldName] = field.fieldTypeName;
      });
      
      // Map custom field values using customFieldName from the API response with proper type conversion
      if (Array.isArray(customFieldValues)) {
        customFieldValues.forEach(cfv => {
          if (cfv.customFieldName) {
            const fieldType = fieldTypeMap[cfv.customFieldName];
            let convertedValue = cfv.valueText;

            // Handle null/undefined/empty values - set appropriate defaults based on field type
            // Also check for string "null" which might be returned by the API
            if (convertedValue === null || convertedValue === undefined || convertedValue === '' || convertedValue === 'null') {
              switch (fieldType) {
                case 'Input':
                case 'TextArea':
                  convertedValue = '';
                  break;
                case 'NumericTextBox':
                case 'Number':
                  convertedValue = null;
                  break;
                case 'Checkbox':
                case 'Switch':
                  convertedValue = false;
                  break;
                case 'DatePicker':
                case 'Date':
                  convertedValue = null;
                  break;
                case 'DropDownList':
                  convertedValue = null;
                  break;
                case 'MultiSelect':
                  convertedValue = [];
                  break;
                default:
                  convertedValue = '';
              }
              customData[cfv.customFieldName] = convertedValue;
              if (cfv.id) {
                customFieldIds[cfv.customFieldName] = cfv.id;
              }
              return;
            }

            // Convert string values to appropriate types based on field type
            switch (fieldType) {
              case 'DatePicker':
              case 'Date':
                // Convert string to Date object for date fields
                if (typeof convertedValue === 'string' && convertedValue.trim() !== '') {
                  const dateValue = new Date(convertedValue);
                  convertedValue = isNaN(dateValue.getTime()) ? null : dateValue;
                }
                break;

              case 'NumericTextBox':
              case 'Number':
                // Convert string to number for numeric fields
                if (typeof convertedValue === 'string' && convertedValue.trim() !== '') {
                  const numValue = parseFloat(convertedValue);
                  convertedValue = isNaN(numValue) ? 0 : numValue;
                }
                break;

              case 'Checkbox':
              case 'Switch':
                // Convert string to boolean for checkbox fields
                if (typeof convertedValue === 'string') {
                  convertedValue = convertedValue.toLowerCase() === 'true' || convertedValue === '1';
                }
                break;

              case 'MultiSelect':
                // Handle MultiSelect values (could be JSON array as string)
                if (typeof convertedValue === 'string' && convertedValue.trim() !== '') {
                  try {
                    const parsed = JSON.parse(convertedValue);
                    convertedValue = Array.isArray(parsed) ? parsed : [convertedValue];
                  } catch {
                    convertedValue = [convertedValue];
                  }
                }
                break;

              case 'Input':
              case 'TextArea':
                // For Input and TextArea, ensure null/"null" values are converted to empty string
                if (convertedValue === null || convertedValue === 'null' || convertedValue === undefined) {
                  convertedValue = '';
                } else {
                  convertedValue = String(convertedValue);
                }
                break;

              default:
                // For DropDownList and other fields, keep as string
                convertedValue = convertedValue;
                break;
            }

            customData[cfv.customFieldName] = convertedValue;
            // Store the custom field value ID for PUT requests
            customFieldIds[cfv.customFieldName] = cfv.id;
          }
        });
      }
      
      
      
      return { customData, customFieldIds };
    } catch (err) {
      return { customData: {}, customFieldIds: {} };
    }
  };

  const initializeFormData = (fields) => {
    const initialData = {};
    fields.forEach(field => {
      switch (field.fieldTypeName) {
        case 'Checkbox':
        case 'Switch':
          initialData[field.name] = false;
          break;
        case 'Number':
        case 'NumericTextBox':
          // Special handling: taxRate should start blank (null), others default to 0
          initialData[field.name] = field.name === 'taxRate' ? null : 0;
          break;
        case 'Date':
          initialData[field.name] = null;
          break;
        case 'DropDownList':
            initialData[field.name] = null;
          break;
        default:
          initialData[field.name] = '';
      }
    });
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
        
        // Reset all state before loading to ensure clean slate
        setCustomFormFields([]);
        setCustomFormData({});
        setCustomFieldValueIds({});
        setOriginalCustomFormData({});
        setSelectedFormId(null);
        
        // Fetch record types first
        const recordTypesData = await fetchRecordTypes();
        if (!isMounted) return;
        setRecordTypes(recordTypesData);
        
                 // Fetch form configuration from API for all record types
         const config = await fetchFormConfiguration(recordType);
        
        if (!isMounted) return;
        setFormConfig(config);
        
        const dropdownFields = config.standardFields.filter(field => 
          field.fieldTypeName === 'DropDownList' && field.source
        );
        
        // Get the typeOfRecord ID for filtering forms
        const typeOfRecordId = getTypeOfRecordIdDirect(config, recordTypesData, recordType);
        
        const dropdownPromises = dropdownFields.map(async field => {
          let data;
          
                     // Special handling for parent field in ChartOfAccount - show only parent accounts
           if (recordType === 'ChartOfAccount' && field.name === 'parent') {
             // Use existing logic but filter for parent accounts only
             data = await fetchDropdownData(field.source);
             // Filter to show only accounts where isParent is true
             data = data.filter(item => item.isParent === true);
           }
          // Special handling for form field - filter by record type
           else if (field.name === 'form' && typeOfRecordId) {
            try {
              const response = await fetch(`${apiConfig.baseURL}/form/by-type-of-record/${typeOfRecordId}`, {
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
              });
              if (!response.ok) throw new Error(`Failed to fetch forms for record type: ${response.status}`);
              data = await response.json();
              data = Array.isArray(data) ? data : (data.results || data.data || []);
            } catch (err) {
              data = [];
            }
          } else {
            // Use existing logic for other dropdown fields
            data = await fetchDropdownData(field.source);
          }
          
          return {
            name: field.name,
            data: data
          };
        });

        const dropdownResults = await Promise.all(dropdownPromises);
        if (!isMounted) return;
        
        const dropdownDataMap = dropdownResults.reduce((acc, { name, data }) => {
          acc[name] = data;
          return acc;
        }, {});
        
        setDropdownData(dropdownDataMap);
        
        const initialFormData = initializeFormData(config.standardFields);

        if (mode !== 'new' && id) {
          const record = await methodMap.fetch(id);
          if (!isMounted) return;
          
          const mergedData = { ...initialFormData };
          
          // Assign standard fields from config
          config.standardFields.forEach(field => {
            if (record[field.name] !== undefined) {
              mergedData[field.name] = record[field.name];
            }
          });
          
          // Also assign any additional fields that exist in the record but not in config
          // This ensures fields like 'form' and 'sequenceNumber' are preserved
          Object.keys(record).forEach(fieldName => {
            if (record[fieldName] !== undefined) {
              mergedData[fieldName] = record[fieldName];
            }
          });
          
          setFormData(mergedData);

          
          // If a form is already selected, load its custom fields
          if (record.form) {
            try {
              const customFields = await fetchCustomFormFields(record.form);
              if (!isMounted) return;
              
              setCustomFormFields(customFields);
              setSelectedFormId(record.form);
              
              // Initialize custom form data and load existing values
              if (customFields.length > 0) {
                const initialCustomData = initializeFormData(customFields.map(f => ({ ...f, name: f.fieldName })));
                
                // Load existing custom field values using the improved API
                // Pass fresh data directly to avoid state timing issues
                const typeOfRecordId = getTypeOfRecordIdDirect(config, recordTypesData, recordType);
                const { customData: existingCustomFieldValues, customFieldIds } = await fetchCustomFieldValues(id, typeOfRecordId, customFields);
                
                if (!isMounted) return;
                
                // Store the custom field value IDs for updates
                setCustomFieldValueIds(customFieldIds);
                
                // Merge initial data with existing values
                const existingCustomData = { ...initialCustomData, ...existingCustomFieldValues };
                setCustomFormData(existingCustomData);
                
                // Store original data for change detection
                setOriginalCustomFormData(existingCustomData);
              }
            } catch (err) {
              // Silent error handling
            }
          }
        } else {
          if (!isMounted) return;
          setFormData(initialFormData);
        }
        
        if (!isMounted) return;
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
  }, [mode, id, recordType]); // Only stable dependencies

  // Cleanup effect to reset state when component unmounts
  useEffect(() => {
    return () => {
      // Clear notification timer
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      
      // Reset state on unmount
      setCustomFormFields([]);
      setCustomFormData({});
      setCustomFieldValueIds({});
      setOriginalCustomFormData({});
      setSelectedFormId(null);
      setFormData({});
      setFormInitialized(false);
      setNotification({ show: false, message: '', type: 'success' });
    };
  }, []); // Only run on mount/unmount

  const combinedFormData = useMemo(() => {
    if (!formInitialized) return {};
    
    if (Object.keys(customFormData).length === 0) {
      return formData;
    }
    
    const customFieldsForForm = {};
    Object.keys(customFormData).forEach(key => {
      customFieldsForForm[`custom_${key}`] = customFormData[key];
    });
    
    return { ...formData, ...customFieldsForForm };
  }, [formData, customFormData, formInitialized]);

  const showNotification = useCallback((message, type = 'success') => {
    // Clear any existing timer
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    
    setNotification({ show: true, message, type });
    
    // Set new timer with ref tracking
    notificationTimerRef.current = setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
      notificationTimerRef.current = null;
    }, 4000);
  }, []);

  const validator = useCallback((values) => {
    const errors = {};
    if (!formConfig?.standardFields) return errors;

    formConfig.standardFields.forEach(field => {
      const value = values[field.name];

      if (recordType === 'Product' && values['itemType']) {
        const itemTypeValue = values['itemType'];
        const INVENTORY_ITEM_TYPE_ID = 'ef765a67-402b-48ee-b898-8eaa45affb64';
        const SERVICE_ITEM_TYPE_ID = 'd89fbe6f-7421-4b41-becf-d94d2bcb6757';

        if (itemTypeValue === INVENTORY_ITEM_TYPE_ID && (field.name === 'expenseAccount' || field.name === 'standardCost')) {
          return;
        }
        if (itemTypeValue === SERVICE_ITEM_TYPE_ID && (field.name === 'inventoryAccount' || field.name === 'averageCost')) {
          return;
        }
      }

      // Special handling for taxAccount field in Tax form - make it conditional based on taxRate
      if (recordType === 'Tax' && field.name === 'taxAccount' && field.isMandatory) {
        const taxRateValue = values['taxRate'];
        const numericTaxRate = (taxRateValue === null || taxRateValue === undefined || taxRateValue === '') ? null : Number(taxRateValue);

        // Only validate taxAccount as mandatory if taxRate is NOT null and NOT 0
        if (numericTaxRate !== null && numericTaxRate !== 0) {
          if (!value || value === '') {
            errors[field.name] = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required`;
          }
        }
        // If taxRate is null or 0, skip validation for taxAccount
        return;
      }

      // Special handling for taxRate field - allow 0 as a valid value
      if (field.isMandatory) {
        if (field.name === 'taxRate') {
          // For taxRate, only fail validation if value is null, undefined, or empty string (0 is valid)
          if (value === null || value === undefined || value === '') {
            errors[field.name] = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required`;
          }
        } else {
          // For other fields, use standard validation
          if (!value || value === '') {
            errors[field.name] = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required`;
          }
        }
      }

      if (field.name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.name] = 'Please enter a valid email address';
      }
      if (field.name === 'phone' && value && !/^\d{10}$/.test(value.replace(/\D/g, ''))) {
        errors[field.name] = 'Phone number must be 10 digits';
      }
    });

    return errors;
  }, [formConfig, recordType]);

    // Helper function to separate form data
  const separateFormData = (formValues) => {
    const standardData = {};
    const customData = {};

    Object.keys(formValues).forEach(key => {
       const value = formValues[key];
       // Convert empty strings to null for dropdown fields
       const processedValue = value === '' ? null : value;
       
      if (key.startsWith('custom_')) {
        const fieldName = key.replace('custom_', '');
        // Store just the value directly - IDs are tracked separately in customFieldValueIds
         customData[fieldName] = processedValue;
      } else {
         standardData[key] = processedValue;
       }
     });

    // Special handling for ChartOfAccount - add parentNumber field
    if (recordType === 'ChartOfAccount') {
      const parentId = standardData.parent;
      
      if (parentId) {
        // Find the selected parent account to get its accountNumber
        const parentOptions = dropdownData['parent'] || [];
        const selectedParent = parentOptions.find(option => option.id === parentId);
        
        if (selectedParent && selectedParent.accountNumber) {
          standardData.parentNumber = selectedParent.accountNumber;
          standardData.parentName = selectedParent.name;
        } else {
          standardData.parentNumber = null;
          standardData.parentName = null;
        }
      } else {
        standardData.parentNumber = null;
        standardData.parentName = null;
      }
    }

    return { standardData, customData };
  };

  // Helper function to get record type ID with fresh data (avoids state timing issues)
  const getTypeOfRecordIdDirect = (config, recordTypesData, recordTypeName) => {
    // Try 1: From form config
    if (config?.recordTypeId) {
      return config.recordTypeId;
    }
    
    // Try 2: From recordTypes lookup with exact name match
    let foundRecordType = recordTypesData.find(rt => rt.name === recordTypeName);
    
    if (foundRecordType) {
      return foundRecordType.id;
    }
    
    // Try 3: From recordTypes lookup with case-insensitive match
    foundRecordType = recordTypesData.find(rt => 
      rt.name?.toLowerCase() === recordTypeName.toLowerCase()
    );
    
    if (foundRecordType) {
      return foundRecordType.id;
    }
    
    // Try 4: Try alternative names
    const alternativeNames = {
      'Customer': ['customer', 'customers'],
      'Vendor': ['vendor', 'vendors'],
      'Product': ['product', 'products'],
      'ChartOfAccount': ['chart-of-account', 'account', 'accounts'],
      'Location': ['location', 'locations'],
      'Tax': ['tax', 'taxes']
    };
    
    const alternatives = alternativeNames[recordTypeName] || [];
    for (const altName of alternatives) {
      foundRecordType = recordTypesData.find(rt => 
        rt.name?.toLowerCase() === altName.toLowerCase()
      );
      if (foundRecordType) {
        return foundRecordType.id;
      }
    }
    
    return null;
  };

  // Helper function to get record type ID
  const getTypeOfRecordId = () => {
    // Try 1: From form config
    if (formConfig?.recordTypeId) {
      return formConfig.recordTypeId;
    }
    
    // Try 2: From recordTypes lookup with exact name match
    let foundRecordType = recordTypes.find(rt => rt.name === recordType);
    
    if (foundRecordType) {
      return foundRecordType.id;
    }
    
    // Try 3: From recordTypes lookup with case-insensitive match
    foundRecordType = recordTypes.find(rt => 
      rt.name?.toLowerCase() === recordType.toLowerCase()
    );
    
    if (foundRecordType) {
      return foundRecordType.id;
    }
    
    // Try 4: Try alternative names
    const alternativeNames = {
      'Customer': ['customer', 'customers'],
      'Vendor': ['vendor', 'vendors'],
      'Product': ['product', 'products'],
      'ChartOfAccount': ['chart-of-account', 'account', 'accounts'],
      'Location': ['location', 'locations'],
      'Tax': ['tax', 'taxes']
    };
    
    const alternatives = alternativeNames[recordType] || [];
    for (const altName of alternatives) {
      foundRecordType = recordTypes.find(rt => 
        rt.name?.toLowerCase() === altName.toLowerCase()
      );
      if (foundRecordType) {
        return foundRecordType.id;
      }
    }
    return null;
  };

  // Helper function to create main record
  const createMainRecord = async (standardData) => {
    const createdRecord = await methodMap.create(standardData);
    const recordId = createdRecord?.id || createdRecord?.data?.id || createdRecord;
    
    if (!recordId) {
      throw new Error('Failed to get record ID from creation response');
    }
    
    return recordId;
  };


  // Helper function to create custom field values
  const createCustomFieldValues = async (customData, recordId, typeOfRecordId) => {
    if (!Object.keys(customData).length || !recordId) return;

    // Build all custom field value payloads for bulk creation
    const customFieldValuesToCreate = Object.entries(customData).map(([fieldName, fieldValue]) => {
      // Get the custom field definition from customFormFields
      const customFieldDef = customFormFields.find(field => field.fieldName === fieldName);
      const customFieldId = customFieldDef?.id;

      const payload = {
        request: "create", // Required field for the API
        typeOfRecord: typeOfRecordId,
        valueText: String(fieldValue), // Ensure it's always a string
        customFieldID: customFieldId,
        recordID: recordId
      };

      return cleanPayload(payload);
    });

    // Execute bulk POST
    if (customFieldValuesToCreate.length > 0) {
      console.log(`📤 Bulk creating ${customFieldValuesToCreate.length} custom field values...`);
      const bulkCreatePayload = { values: customFieldValuesToCreate };

      const bulkCreateResponse = await fetch(`${apiConfig.baseURL}/custom-field-value`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(bulkCreatePayload)
      });

      if (!bulkCreateResponse.ok) {
        const errorText = await bulkCreateResponse.text();
        throw new Error(`Failed to bulk create custom field values: ${bulkCreateResponse.status} - ${errorText}`);
      }

      const result = await bulkCreateResponse.json();
      console.log(`✅ Successfully bulk created ${customFieldValuesToCreate.length} custom field values`);
      return result;
    }
  };

  const updateCustomFieldValues = async (customData, recordId, typeOfRecordId) => {
    if (!Object.keys(customData).length || !recordId) return;

    // Only update fields that have actually changed
    const changedFields = {};
    Object.entries(customData).forEach(([fieldName, fieldValue]) => {
      const originalValue = originalCustomFormData[fieldName];
      if (originalValue !== fieldValue) {
        changedFields[fieldName] = fieldValue;
      }
    });

    if (Object.keys(changedFields).length === 0) {
      return; // No changes to update
    }

    // Separate fields into updates (existing) and creates (new)
    const fieldsToUpdate = [];
    const fieldsToCreate = [];

    Object.entries(changedFields).forEach(([fieldName, fieldValue]) => {
      // Get the custom field definition from customFormFields
      const customFieldDef = customFormFields.find(field => field.fieldName === fieldName);
      const customFieldId = customFieldDef?.id;

      // Get the existing custom field value ID (for PUT) or null (for POST)
      const existingCustomFieldValueId = customFieldValueIds[fieldName];

      const payload = {
        request: existingCustomFieldValueId ? "update" : "create",
        typeOfRecord: typeOfRecordId,
        valueText: String(fieldValue), // Ensure it's always a string
        customFieldID: customFieldId,
        recordID: recordId
      };

      if (existingCustomFieldValueId) {
        fieldsToUpdate.push({
          ...cleanPayload(payload),
          id: existingCustomFieldValueId
        });
      } else {
        fieldsToCreate.push(cleanPayload(payload));
      }
    });

    // Execute bulk PUT for updates
    if (fieldsToUpdate.length > 0) {
      console.log(`📤 Bulk updating ${fieldsToUpdate.length} custom field values...`);
      const bulkUpdatePayload = { values: fieldsToUpdate };

      const bulkUpdateResponse = await fetch(`${apiConfig.baseURL}/custom-field-value`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(bulkUpdatePayload)
      });

      if (!bulkUpdateResponse.ok) {
        const errorText = await bulkUpdateResponse.text();
        throw new Error(`Failed to bulk update custom field values: ${bulkUpdateResponse.status} - ${errorText}`);
      }

      console.log(`✅ Successfully bulk updated ${fieldsToUpdate.length} custom field values`);
    }

    // Execute bulk POST for creates
    if (fieldsToCreate.length > 0) {
      console.log(`📤 Bulk creating ${fieldsToCreate.length} custom field values...`);
      const bulkCreatePayload = { values: fieldsToCreate };

      const bulkCreateResponse = await fetch(`${apiConfig.baseURL}/custom-field-value`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(bulkCreatePayload)
      });

      if (!bulkCreateResponse.ok) {
        const errorText = await bulkCreateResponse.text();
        throw new Error(`Failed to bulk create custom field values: ${bulkCreateResponse.status} - ${errorText}`);
      }

      console.log(`✅ Successfully bulk created ${fieldsToCreate.length} custom field values`);
    }
  };

  // Helper function to handle record update
  const updateRecord = async (standardData, customData, typeOfRecordId) => {
    // Stage 1: Update the main record with standard data only
    await methodMap.update(id, standardData);
    
    // Stage 2: Update custom field values using the dedicated API
    let changedFieldsCount = 0;
    if (Object.keys(customData).length > 0 && typeOfRecordId) {
      // Count only changed fields
      const changedFields = {};
      Object.entries(customData).forEach(([fieldName, fieldValue]) => {
        const originalValue = originalCustomFormData[fieldName];
        if (originalValue !== fieldValue) {
          changedFields[fieldName] = fieldValue;
        }
      });
      changedFieldsCount = Object.keys(changedFields).length;
      
      if (changedFieldsCount > 0) {
        await updateCustomFieldValues(customData, id, typeOfRecordId);
      }
    }
    
    return changedFieldsCount;
  };

  // Main submit handler - optimized and clean
  const handleSubmit = async (formValues) => {
    try {
      setLoading(true);
      setError(null);

      const { standardData, customData } = separateFormData(formValues);
      const typeOfRecordId = getTypeOfRecordId();

      if (mode === 'new') {
        // Special validation for ChartOfAccount - check if account number already exists
        if (recordType === 'ChartOfAccount' && standardData.accountNumber) {
          try {
            const checkUrl = `${apiConfig.baseURL}/chart-of-account/check-account-number-exists?accountNumber=${encodeURIComponent(standardData.accountNumber)}`;
            const checkResponse = await fetch(checkUrl, {
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });

            if (!checkResponse.ok) {
              throw new Error(`Failed to check account number: ${checkResponse.status}`);
            }

            const accountNumberExists = await checkResponse.json();

            if (accountNumberExists === true) {
              setLoading(false);
              alert(`Account number "${standardData.accountNumber}" already exists. Please use a different account number.`);
              return; // Stop the creation process
            }
          } catch (err) {
            setLoading(false);
            alert(`Error checking account number: ${err.message}`);
            return; // Stop the creation process on error
          }
        }

        // Special handling for ChartOfAccount - set runningBalance equal to openingBalance in new mode
        if (recordType === 'ChartOfAccount' && standardData.openingBalance !== undefined && standardData.openingBalance !== null) {
          standardData.runningBalance = standardData.openingBalance;
        }

        // Stage 1: Create main record
        const recordId = await createMainRecord(standardData);

     

        // Stage 3: Create custom field values
        await createCustomFieldValues(customData, recordId, typeOfRecordId);

        // Success notification
        showNotification(`${recordType} created successfully with ${Object.keys(customData).length} custom fields`, 'success');
      } else {
        // Update mode
        const customFieldCount = await updateRecord(standardData, customData, typeOfRecordId);
        showNotification(`${recordType} updated successfully with ${customFieldCount} custom fields`, 'success');
      }

      navigate(navigationPaths[recordType] || '/customer');
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to delete custom field values for a record using bulk delete API
  const deleteCustomFieldValues = async (recordId, typeOfRecordId) => {
    if (!recordId || !typeOfRecordId) return;

    try {
      // Fetch all custom field values for this record
      const response = await fetch(`${apiConfig.baseURL}/custom-field-value/by-type-and-record?typeOfRecord=${typeOfRecordId}&recordId=${recordId}`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (response.ok) {
        const customFieldValues = await response.json();

        if (Array.isArray(customFieldValues) && customFieldValues.length > 0) {
          // Extract all IDs for bulk delete
          const idsToDelete = customFieldValues.map(cfv => cfv.id);

          // Use bulk delete API with { ids: [] } structure
          console.log(`🗑️ Bulk deleting ${idsToDelete.length} custom field values for ${recordType} ${recordId}...`);
          const deleteResponse = await fetch(`${apiConfig.baseURL}/custom-field-value`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ ids: idsToDelete })
          });

          if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            console.warn(`Failed to bulk delete custom field values: ${deleteResponse.status} - ${errorText}`);
          } else {
            console.log(`✅ Successfully bulk deleted ${idsToDelete.length} custom field values for ${recordType} ${recordId}`);
          }
        }
      } else if (response.status !== 404) {
        console.warn(`Failed to fetch custom field values for deletion: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting custom field values:', error);
      // Don't throw - this is cleanup, not critical
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      // Delete custom field values before deleting the main record
      const typeOfRecordId = getTypeOfRecordId();
      await deleteCustomFieldValues(id, typeOfRecordId);

      // Delete the main record
      await methodMap.delete(id);

      showNotification(`${recordType} deleted successfully`, 'success');
      navigate(navigationPaths[recordType] || '/customer');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleFormSelection = useCallback(async (selectedValue) => {
    if (!selectedValue) {
      setCustomFormFields([]);
      setCustomFormData({});
      setCustomFieldValueIds({});
      setOriginalCustomFormData({});
      setSelectedFormId(null);
      
      // Only update sequenceNumber if it exists in the form configuration
      const hasSequenceNumberField = formConfig?.standardFields?.some(field => field.name === 'sequenceNumber');
      if (hasSequenceNumberField) {
                 setFormData(prev => ({ ...prev, sequenceNumber: null }));
      }
      return;
    }

        try {
          setLoading(true);
          const customFields = await fetchCustomFormFields(selectedValue);
          setCustomFormFields(customFields);
          setSelectedFormId(selectedValue);
          
          const initialCustomData = initializeFormData(customFields.map(f => ({ ...f, name: f.fieldName })));
          
          // If in edit mode, load existing custom field values for the selected form
          if (mode !== 'new' && id) {
            const typeOfRecordId = getTypeOfRecordId();
            const { customData: existingCustomFieldValues, customFieldIds } = await fetchCustomFieldValues(id, typeOfRecordId, customFields);
            
            // Store the custom field value IDs for updates
            setCustomFieldValueIds(customFieldIds);
            
            const mergedCustomData = { ...initialCustomData, ...existingCustomFieldValues };
            setCustomFormData(mergedCustomData);
            
            // Store original data for change detection
            setOriginalCustomFormData(mergedCustomData);
          } else {
            setCustomFormData(initialCustomData);
            
            // Store original data for change detection
            setOriginalCustomFormData(initialCustomData);
          }
          
      const [formResponse, sequenceResponse] = await Promise.all([
        fetch(`${apiConfig.baseURL}/form/${selectedValue}`, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        }),
        fetch(`${apiConfig.baseURL}/form-sequence/by-form/${selectedValue}`, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        })
      ]);

      let generatedSequenceNumber = '';
      if (formResponse.ok && sequenceResponse.ok) {
        const [formData, sequenceDataArray] = await Promise.all([
          formResponse.text().then(text => text.trim() ? JSON.parse(text) : {}),
          sequenceResponse.text().then(text => text.trim() ? JSON.parse(text) : [])
        ]);

        // Handle array response - pick the first item
        const sequenceData = Array.isArray(sequenceDataArray) && sequenceDataArray.length > 0 
          ? sequenceDataArray[0] 
          : { formSequenceNumber: 0 };

        const prefix = formData.prefix || '';
        const nextSequenceNumber = (sequenceData.formSequenceNumber || 0) + 1;
        generatedSequenceNumber = `${prefix}${String(nextSequenceNumber).padStart(4, '0')}`;
      }

      // Only update fields that exist in the form configuration
      const hasFormField = formConfig?.standardFields?.some(field => field.name === 'form');
      const hasSequenceNumberField = formConfig?.standardFields?.some(field => field.name === 'sequenceNumber');
      
      const updatedFormData = {};
      if (hasFormField) {
        updatedFormData.form = selectedValue;
      }
      if (hasSequenceNumberField) {
        updatedFormData.sequenceNumber = generatedSequenceNumber;
      }
      
      setFormData(prev => ({
        ...prev,
        ...updatedFormData
      }));
        } catch (err) {
      // Only update form field if it exists in the configuration
      const hasFormField = formConfig?.standardFields?.some(field => field.name === 'form');
      if (hasFormField) {
        setFormData(prev => ({ ...prev, form: selectedValue }));
      }
        } finally {
          setLoading(false);
    }
  }, [formConfig, fetchCustomFormFields, mode, id, getTypeOfRecordId, fetchCustomFieldValues, initializeFormData]);

  // Store dropdown data in ref to prevent re-renders
  const dropdownDataCache = useRef({});
  
  const getDropdownProps = useCallback((fieldRenderProps) => {
    const { name: fieldName, onChange, value } = fieldRenderProps;
    const options = dropdownData[fieldName] || [];
    
    // Create cache key based on data length and first item
    const cacheKey = `${fieldName}_${options.length}_${options[0]?.id || options[0] || ''}`;
    
    // Use cached data if available and unchanged
    let transformedOptions;
    if (dropdownDataCache.current[cacheKey]) {
      transformedOptions = dropdownDataCache.current[cacheKey];
    } else {
      transformedOptions = options.map(item => {
        if (typeof item === 'string') return { text: item, value: item };
        if (!item.id) return { text: String(item), value: item };
        
        // Dynamic field detection - find the best display field
        const getDisplayText = (obj) => {
          const keys = Object.keys(obj);
             
           // Fall back to generic "name" field (but not formName for non-form dropdowns)
           if (obj.name) {
            return obj.name;
          }
          
          // Special handling for form dropdown - prioritize formName
          if (fieldName === 'form' && obj.formName) {
            return obj.formName;
          }
          
          // Priority 3: Handle special cases with formatted text
          if (obj.accountName && obj.accountNumber) {
            return `${obj.accountNumber} - ${obj.accountName}`;
          }
          if (obj.itemName && obj.itemCode) {
            return `${obj.itemCode} - ${obj.itemName}`;
          }
          
          // Priority 4: Any field with "name" in it (case insensitive)
           const nameRelatedFields = keys.filter(key => 
             key.toLowerCase().includes('name') && 
             obj[key]
           );
           if (nameRelatedFields.length > 0) {
             // For form dropdown, prioritize formName
             if (fieldName === 'form' && obj.formName) {
               return obj.formName;
             }
             // For other dropdowns, exclude formName
             const filteredNameFields = fieldName === 'form' ? nameRelatedFields : nameRelatedFields.filter(key => key.toLowerCase() !== 'formname');
             if (filteredNameFields.length > 0) {
               return obj[filteredNameFields[0]];
             }
           }
           
          // Priority 5: First string field that's not id
          const stringField = keys.find(key => 
            key !== 'id' && 
            typeof obj[key] === 'string' && 
            obj[key].trim().length > 0
          );
          if (stringField) {
            return obj[stringField];
          }
          
          // Last resort: use id as string
          return String(obj.id);
        };
        
        const displayText = getDisplayText(item);
        return { text: displayText, value: item.id };
      });
      
      // Cache the transformed data
      dropdownDataCache.current[cacheKey] = transformedOptions;
    }

    const optionsWithEmpty = [{ text: '-- Select --', value: null }, ...transformedOptions];
    const selectedOption = (value !== null && value !== undefined && value !== '') ? optionsWithEmpty.find(option => option.value === value) : optionsWithEmpty[0];

    return {
      data: optionsWithEmpty,
      textField: 'text',
      valueField: 'value',
      value: selectedOption,
      virtual: false,
      popupSettings: {
        appendTo: document.body,
        animate: false
      },
      onChange: async (e) => {
        const selectedValue = e.target.value?.value || e.target.value;
        // Convert empty string to null for dropdown fields
        const valueToPass = (selectedValue === '' || selectedValue === undefined) ? null : selectedValue;
        if (onChange) onChange({ target: { value: valueToPass } });

        if (fieldName === 'form') {
           await handleFormSelection(valueToPass);
        }
      }
    };
  }, [dropdownData, handleFormSelection]);

  const getMultiSelectProps = useCallback((fieldRenderProps) => {
    const { name: fieldName } = fieldRenderProps;
    const fieldData = dropdownData[fieldName] || [];

    const processedData = fieldData.map(item => {
      if (typeof item === 'string') return { text: item, value: item };
      if (item.name && item.id) return { text: item.name, value: item.id };
      if (item.text && item.value) return item;
      const keys = Object.keys(item);
      return { text: item[keys[0]], value: item[keys[0]] };
    });

    return {
      data: processedData,
      textField: 'text',
      valueField: 'value'
    };
  }, [dropdownData]);

  const createFieldComponent = useCallback((Component, type = 'default') => (fieldRenderProps) => {
    const { validationMessage, touched, label, name, ...others } = fieldRenderProps;
    const showValidationMessage = touched && validationMessage;

    // Check if this is a phone field
    const isPhoneField = name === 'phone' || name === 'Phone' || (typeof name === 'string' && name.toLowerCase().includes('phone'));

    // Check if this is a taxRate field
    const isTaxRateField = name === 'taxRate';

    // Check if this is a salesPrice or purchasePrice field
    const isPriceField = name === 'salesPrice' || name === 'purchasePrice';

    const commonProps = {
      ...others,
      name,
      className: showValidationMessage ? 'k-state-invalid' : '',
      style: { width: '100%' },
      disabled: mode === 'view' || others.disabled
    };

    // Add maxLength for phone fields
    if (isPhoneField && type === 'text') {
      commonProps.maxLength = 10;
    }

    const componentProps = {
      text: { component: Input, props: commonProps },
      // For taxRate field, don't set min (allow 0), for others set min to 0
      // For salesPrice and purchasePrice, allow 10 decimal places
      number: {
        component: NumericTextBox,
        props: {
          ...commonProps,
          min: 0,
          step: isPriceField ? 0.01 : 0,
          spinners: false,
          // Allow 10 decimal places for price fields
          decimals: isPriceField ? 10 : undefined,
          format: isPriceField ? '#.##########' : undefined
        }
      },
      textarea: { component: TextArea, props: { ...commonProps, rows: 4 } },
      checkbox: {
        component: Checkbox,
        props: {
          ...commonProps,
          label: label,
          checked: others.value || false,
          style: { display: 'flex', alignItems: 'center' }
        }
      },
      date: { component: DatePicker, props: commonProps },
      dropdown: { component: DropDownList, props: { ...commonProps, ...getDropdownProps(fieldRenderProps) } },
      multiselect: { component: MultiSelect, props: { ...commonProps, ...getMultiSelectProps(fieldRenderProps) } }
    };

    const config = componentProps[type] || componentProps.text;
    return (
      <div>
        <config.component {...config.props} />
        {showValidationMessage && <div className="k-form-error">{validationMessage}</div>}
      </div>
    );
  }, [mode, getDropdownProps, getMultiSelectProps]);



  const fieldComponents = useMemo(() => ({
    Input: createFieldComponent(Input, 'text'),
    TextArea: createFieldComponent(TextArea, 'textarea'),
    Checkbox: createFieldComponent(Checkbox, 'checkbox'),
    NumericTextBox: createFieldComponent(Input, 'number'),
    Number: createFieldComponent(Input, 'number'),
    DropDownList: createFieldComponent(DropDownList, 'dropdown'),
    DatePicker: createFieldComponent(DatePicker, 'date'),
    MultiSelect: createFieldComponent(MultiSelect, 'multiselect')
  }), [createFieldComponent]);

  const getFieldComponent = (field) => fieldComponents[field.fieldTypeName] || fieldComponents.Input;

  const getFieldLabel = (field, formRenderProps = null) => {
    const label = field.displayName || field.label || field.name.charAt(0).toUpperCase() + field.name.slice(1);
    let isMandatory = field.isMandatory;

    if (recordType === 'Product' && formRenderProps) {
      const itemTypeValue = formRenderProps.valueGetter('itemType');
      const INVENTORY_ITEM_TYPE_ID = 'ef765a67-402b-48ee-b898-8eaa45affb64';
      const SERVICE_ITEM_TYPE_ID = 'd89fbe6f-7421-4b41-becf-d94d2bcb6757';

      if (itemTypeValue === INVENTORY_ITEM_TYPE_ID && (field.name === 'expenseAccount' || field.name === 'standardCost')) {
        isMandatory = false;
      }
      if (itemTypeValue === SERVICE_ITEM_TYPE_ID && (field.name === 'inventoryAccount' || field.name === 'averageCost')) {
        isMandatory = false;
      }
    }

    if (recordType === 'ChartOfAccount' && field.name === 'accountNumber' && formRenderProps) {
      const isParentValue = formRenderProps.valueGetter('isParent');
      isMandatory = isParentValue;
    }

    if (recordType === 'Tax' && field.name === 'taxAccount' && formRenderProps) {
      const taxRateValue = formRenderProps.valueGetter('taxRate');
      const numericTaxRate = (taxRateValue === null || taxRateValue === undefined || taxRateValue === '') ? null : Number(taxRateValue);
      if (numericTaxRate === null || numericTaxRate === 0) {
        isMandatory = false;
      }
    }

    return isMandatory ? `${label} *` : label;
  };

  const getFieldValidator = useCallback((field, formRenderProps = null) => {
    let isMandatory = field.isMandatory;

    if (recordType === 'Product' && formRenderProps) {
      const itemTypeValue = formRenderProps.valueGetter('itemType');
      const INVENTORY_ITEM_TYPE_ID = 'ef765a67-402b-48ee-b898-8eaa45affb64';
      const SERVICE_ITEM_TYPE_ID = 'd89fbe6f-7421-4b41-becf-d94d2bcb6757';

      if (itemTypeValue === INVENTORY_ITEM_TYPE_ID && (field.name === 'expenseAccount' || field.name === 'standardCost')) {
        return undefined;
      }
      if (itemTypeValue === SERVICE_ITEM_TYPE_ID && (field.name === 'inventoryAccount' || field.name === 'averageCost')) {
        return undefined;
      }
    }

    if (recordType === 'ChartOfAccount' && field.name === 'accountNumber' && formRenderProps) {
      const isParentValue = formRenderProps.valueGetter('isParent');
      isMandatory = isParentValue;
    }

    if (recordType === 'Tax' && field.name === 'taxAccount' && formRenderProps) {
      const taxRateValue = formRenderProps.valueGetter('taxRate');
      const numericTaxRate = (taxRateValue === null || taxRateValue === undefined || taxRateValue === '') ? null : Number(taxRateValue);
      if (numericTaxRate === null || numericTaxRate === 0) {
        isMandatory = false;
      }
    }

    if (!isMandatory) return undefined;

    return (value) => {
      if (field.name === 'taxRate') {
        if (value === null || value === undefined || value === '') {
          const displayName = field.displayName || field.label || field.name.charAt(0).toUpperCase() + field.name.slice(1);
          return `${displayName} is required`;
        }
      } else {
        if (!value || value === '') {
          const displayName = field.displayName || field.label || field.name.charAt(0).toUpperCase() + field.name.slice(1);
          return `${displayName} is required`;
        }
      }

      if (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      if (field.name === 'phone' && !/^\d{10}$/.test(value.replace(/\D/g, ''))) {
        return 'Phone number must be 10 digits';
      }
      return '';
    };
  }, [recordType]);

  const getCustomFieldValidator = (field) => {
    if (!field.isRequired) return undefined;
    return (value) => {
      if (!value || value === '') {
        return `${field.fieldLabel || field.fieldName} is required`;
      }
      return '';
    };
  };

  const renderSingleField = useCallback((field, isCustom, isFullWidth = false, customKey = null, formRenderProps = null) => {
    const fieldName = isCustom ? `custom_${field.fieldName || field.name}` : field.name;
    const fieldId = isCustom ? field.fieldName || field.name : field.name;
    const key = customKey || `${isCustom ? 'custom' : 'standard'}-field-${field.id || fieldId}`;

    const label = isCustom
      ? `${field.fieldLabel || field.fieldName}${field.isRequired ? ' *' : ''}`
      : getFieldLabel(field, formRenderProps);

    const component = getFieldComponent(field);
    const validator = isCustom ? getCustomFieldValidator(field) : getFieldValidator(field, formRenderProps);
    const isCheckbox = field.fieldTypeName === 'Checkbox' || field.fieldTypeName === 'Switch';

    // Dynamic field state logic for ChartOfAccount accountNumber field
    let fieldDisabled = mode === 'view' || field.isDisabled;

    // Special handling for accountNumber field in ChartOfAccount - always enabled
    if (recordType === 'ChartOfAccount' && field.name === 'accountNumber') {
      // Keep accountNumber always enabled regardless of isParent checkbox state
      fieldDisabled = mode === 'view' || field.isDisabled;
    }

    // Special handling for openingBalance field in ChartOfAccount - only editable in new mode
    if (recordType === 'ChartOfAccount' && field.name === 'openingBalance') {
      // Disable in edit and view modes, only allow editing in new mode
      fieldDisabled = mode === 'edit' || mode === 'view' || field.isDisabled;
    }

    // Special handling for Product account fields - disable in edit mode
    if (recordType === 'Product' && mode === 'edit') {
      const accountFields = ['inventoryAccount', 'cogsAccount', 'salesAccount', 'expenseAccount'];
      if (accountFields.includes(field.name) || accountFields.includes(fieldName)) {
        fieldDisabled = true;
      }
    }

    // Special handling for Product record type - conditional field hiding based on itemType
    if (recordType === 'Product' && formRenderProps) {
      const itemTypeValue = formRenderProps.valueGetter('itemType');

      // Hide expenseAccount if itemType is Inventory Item
      if ((field.name === 'expenseAccount' || fieldName === 'expenseAccount') &&
          itemTypeValue === 'ef765a67-402b-48ee-b898-8eaa45affb64') {
        return null; // Hide the field
      }

      // Hide inventoryAccount if itemType is Service Item
      if ((field.name === 'inventoryAccount' || fieldName === 'inventoryAccount') &&
          itemTypeValue === 'd89fbe6f-7421-4b41-becf-d94d2bcb6757') {
        return null; // Hide the field
      }

      // Hide standardCost if itemType is Inventory Item (show averageCost instead)
      if ((field.name === 'standardCost' || fieldName === 'standardCost') &&
          itemTypeValue === 'ef765a67-402b-48ee-b898-8eaa45affb64') {
        return null; // Hide the field
      }

      // Hide averageCost if itemType is Service Item (show standardCost instead)
      if ((field.name === 'averageCost' || fieldName === 'averageCost') &&
          itemTypeValue === 'd89fbe6f-7421-4b41-becf-d94d2bcb6757') {
        return null; // Hide the field
      }
    }

    return (
      <div
        key={key}
        className={`master-field-group ${isFullWidth ? 'master-field-full' : ''} ${isCheckbox ? 'checkbox-wrapper' : ''}`}
      >
        {!isCheckbox && <label className="k-label">{label}</label>}
        <div className="field-wrapper">
        <Field
          id={fieldName}
          name={fieldName}
          component={component}
          validator={validator}
          disabled={fieldDisabled}
          label={isCheckbox ? label : undefined}
          onChange={(e) => {
            // Handle chart of accounts field changes
            if (recordType === 'ChartOfAccount' && (field.name === 'isParent' || field.name === 'parent')) {
              try {
                // Handle different event structures for different field types
                let value;
                
                // Check if e is null or undefined
                if (e === null || e === undefined) {
                  value = null;
                } else if (typeof e === 'boolean' || typeof e === 'string' || typeof e === 'number') {
                  // Direct value (for some field types)
                  value = e;
                } else if (typeof e === 'object') {
                  // Object event - try different properties in order of likelihood
                  if (e.hasOwnProperty('value')) {
                    value = e.value;
                  } else if (e.hasOwnProperty('checked')) {
                    // For checkbox events
                    value = e.checked;
                  } else if (e.hasOwnProperty('target') && e.target) {
                    // Handle target-based events
                    if (e.target.hasOwnProperty('value')) {
                      value = e.target.value;
                    } else if (e.target.hasOwnProperty('checked')) {
                      value = e.target.checked;
                    } else {
                      value = e.target;
                    }
                  } else {
                    value = e;
                  }
                } else {
                  // Fallback for any other type
                  value = e;
                }
                
                handleChartOfAccountFieldChange(field.name, value, formRenderProps);
              } catch (error) {
                // Silent error handling
              }
            }
          }}
        />
        </div>
      </div>
    );
  }, [mode, recordType, getFieldComponent, getFieldLabel, getFieldValidator, getCustomFieldValidator, handleChartOfAccountFieldChange]);

  const renderFields = useCallback((fields, isCustom = false, formRenderProps = null) => {
    const processedFields = [];
    let currentRow = [];
    
    fields.forEach((field) => {
      const isFullWidth = ['TextArea', 'Checkbox', 'MultiSelect'].includes(field.fieldTypeName);
      
      if (isFullWidth) {
        if (currentRow.length > 0) {
          processedFields.push({ type: 'row', fields: [...currentRow] });
          currentRow = [];
        }
        processedFields.push({ type: 'fullWidth', field });
      } else {
        currentRow.push(field);
        
        if (currentRow.length === 3) {
          processedFields.push({ type: 'row', fields: [...currentRow] });
          currentRow = [];
        }
      }
    });
    
    if (currentRow.length > 0) {
      processedFields.push({ type: 'row', fields: [...currentRow] });
    }

    return processedFields.map((item, index) => {
      const keyPrefix = isCustom ? 'custom' : 'standard';

          if (item.type === 'row') {
          return (
          <React.Fragment key={`${keyPrefix}-row-${index}`}>
            {item.fields.map((field) => renderSingleField(field, isCustom, false, null, formRenderProps))}
              </React.Fragment>
        );
      }

      return renderSingleField(item.field, isCustom, true, `${keyPrefix}-full-${index}`, formRenderProps);
    });
  }, [renderSingleField]);

  if (loading || dynamicLoading || !formConfig || !formInitialized) {
    return (
      <div className="master-form-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <div>Loading {recordType.toLowerCase()} form...</div>
        </div>
      </div>
    );
  }

  if (error || dynamicError) {
    return (
      <div className="master-form-container">
        <div className="error-message">
          <h3>Error Loading {recordType}</h3>
          <p>{error || dynamicError}</p>
          <Button onClick={() => navigate(navigationPaths[recordType] || '/customer')}>
            Back to {recordType} List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="master-form-container" data-theme={recordType.toLowerCase()}>
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

      <div className="master-form-header">
        <h2>
          {mode === 'new' ? `Create New ${recordType}` : 
           mode === 'edit' ? `Edit ${recordType}` : `View ${recordType}`}
        </h2>
      </div>

      <div className="master-form-element">
      <Form
        key={`${recordType.toLowerCase()}-form-${mode}-${id || 'new'}-${selectedFormId || 'no-form'}`}
        initialValues={combinedFormData}
        validator={validator}
        onSubmit={handleSubmit}
        render={(formRenderProps) => (
          <FormElement>
              <div className="master-form-content">
                {recordType === 'Product' ? (
                  // Tabbed interface for Product forms
                  <>
                    <div className="product-tabs">
                      <button
                        type="button"
                        className={`product-tab ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                      >
                        <FaClipboardList /> Product Information
                      </button>
                      <button
                        type="button"
                        className={`product-tab ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                      >
                        <FaBoxes /> Inventory
                      </button>
                    </div>
                    
                    <div className="tab-content">
                      {activeTab === 'general' && (
                        <>
                          <div className="form-section">
                            <div className="section-header">
                              <h3 className="section-title">Standard Fields</h3>
                            </div>
                            <div className="master-form-row">
                              {renderFields(formConfig.standardFields, false, formRenderProps)}
                            </div>
                          </div>

                          {customFormFields.length > 0 && (
                            <div className="form-section">
                              <div className="section-header">
                                <h3 className="section-title">Custom Fields</h3>
                              </div>
                              <div className="master-form-row">
                                {renderFields(customFormFields, true, formRenderProps)}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {activeTab === 'inventory' && (
                        <InventoryTab formRenderProps={formRenderProps} mode={mode} />
                      )}
                    </div>
                  </>
                ) : (
                  // Standard layout for non-Product forms
                  <>
                    <div className="form-section">
                      <div className="section-header">
                        <h3 className="section-title">Standard Fields</h3>
                      </div>
                      <div className="master-form-row">
                        {renderFields(formConfig.standardFields, false, formRenderProps)}
                      </div>
                    </div>

                    {customFormFields.length > 0 && (
                      <div className="form-section">
                        <div className="section-header">
                          <h3 className="section-title">Custom Fields</h3>
                        </div>
                        <div className="master-form-row">
                          {renderFields(customFormFields, true, formRenderProps)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="master-form-actions">
              <Button
                type="button"
                onClick={() => navigate(navigationPaths[recordType] || '/customer')}
                className="k-button k-button-secondary"
              >
                <FaTimes /> {mode === 'view' ? 'Close' : 'Cancel'}
              </Button>
              {mode === 'view' && recordType === 'ChartOfAccount' && (
                <Button
                  type="button"
                  onClick={() => navigate(`/chart-of-account/edit/${id}`)}
                  className="k-button k-button-primary"
                >
                  <FaEdit /> Edit
                </Button>
              )}
              {mode !== 'new' && (
                <Button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="k-button k-button-danger"
                >
                  <FaTrash /> Delete
                </Button>
              )}
              {mode !== 'view' && (
                <Button
                  type="submit"
                  disabled={loading || !formRenderProps.allowSubmit}
                  className="k-button k-button-primary"
                >
                  <FaSave /> {loading ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </FormElement>
        )}
      />
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Delete"
        message={
          <>
            <p>Are you sure you want to delete this {recordType.toLowerCase()}?</p>
            <p><strong>This action cannot be undone.</strong></p>
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={loading}
      />
    </div>
  );
});

export const CustomerForm = (props) => <MasterDataForm {...props} recordType="Customer" />;
export const VendorForm = (props) => <MasterDataForm {...props} recordType="Vendor" />;
export const LocationForm = (props) => <MasterDataForm {...props} recordType="Location" />;
export const ChartOfAccountForm = (props) => <MasterDataForm {...props} recordType="ChartOfAccount" />;
export const ProductForm = (props) => <MasterDataForm {...props} recordType="Product" />;
export const TaxForm = (props) => <MasterDataForm {...props} recordType="Tax" />;

export default MasterDataForm; 