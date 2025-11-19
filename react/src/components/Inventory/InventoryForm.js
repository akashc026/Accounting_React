import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Field, FormElement, FieldArray } from '@progress/kendo-react-form';
import { Input, TextArea, NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import ConfirmDialog from '../shared/ConfirmDialog';
import { FaSave, FaTimes, FaTrash, FaPlus, FaBoxes, FaChartBar } from 'react-icons/fa';
import { useDynamicForm } from '../../hooks/useDynamicForm';
import useInventoryDetail from '../../hooks/useInventoryDetail';
import { processJvLines, validateJvAccountsBeforeCreate, generateJvLines } from '../../hooks/useProcessingJvLines';
import { processJournal } from '../../hooks/useJournal';
import { apiConfig, buildUrl } from '../../config/api';
import InventoryItems from './InventoryItems';
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

// Tab styles for Inventory form - compact rectangle tabs
const tabStyles = `
  .inventory-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid #e8eaed;
    margin-bottom: 0;
    background: transparent;
    padding: 0;
  }

  .inventory-tab {
    padding: 8px 16px;
    background: #f8f9fa;
    border: 1px solid #e8eaed;
    border-bottom: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: #5f6368;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    position: relative;
    border-radius: 6px 6px 0 0;
    white-space: nowrap;
  }

  .inventory-tab:hover {
    background: #e8f0fe;
    color: #1a73e8;
  }

  .inventory-tab.active {
    background: white;
    color: #1a73e8;
    border-bottom: 2px solid white;
    margin-bottom: -2px;
    font-weight: 700;
  }

  .inventory-tab svg {
    font-size: 14px;
  }

  .inventory-tab:nth-child(1) svg {
    color: #4285f4;
  }

  .inventory-tab:nth-child(1).active svg {
    color: #4285f4;
  }

  .inventory-tab:nth-child(2) svg {
    color: #34a853;
  }

  .inventory-tab:nth-child(2).active svg {
    color: #34a853;
  }

  .inventory-tab-content {
    background: white;
    border: 1px solid #e8eaed;
    border-top: none;
    padding: 0;
    min-height: 300px;
  }

  .gl-impact-section {
    padding: 24px;
    background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
    border-radius: 0;
    margin: 0;
    min-height: 300px;
  }

  .gl-impact-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f1f3f4;
  }

  .gl-impact-header h3 {
    margin: 0;
    color: #202124;
    font-size: 16px;
    font-weight: 600;
  }

  .gl-impact-icon {
    color: #1a73e8;
    font-size: 16px;
  }

  .gl-impact-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06);
    border: 1px solid #e8eaed;
    background: white;
  }

  .gl-impact-table th {
    background: linear-gradient(135deg, #f8f9fa 0%, #e8eaed 100%);
    color: #5f6368;
    padding: 10px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    position: relative;
    border: none;
    border-bottom: 2px solid #e8eaed;
  }

  .gl-impact-table th:first-child {
    border-radius: 8px 0 0 0;
  }

  .gl-impact-table th:last-child {
    border-radius: 0 8px 0 0;
  }

  .gl-impact-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f3f4;
    font-size: 13px;
    color: #202124;
    font-weight: 400;
    position: relative;
    vertical-align: middle;
  }

  .gl-impact-table tbody tr {
    transition: all 0.3s ease;
    background: white;
  }

  .gl-impact-table tbody tr:nth-child(even) {
    background: #fafbfc;
  }

  .gl-impact-table tbody tr:hover {
    background: linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(26,115,232,0.12);
  }

  .gl-impact-table tbody tr:hover td {
    color: #1a73e8;
  }

  .gl-impact-table tbody tr:last-child td {
    border-bottom: none;
  }

  .gl-impact-table tbody tr:last-child td:first-child {
    border-radius: 0 0 0 8px;
  }

  .gl-impact-table tbody tr:last-child td:last-child {
    border-radius: 0 0 8px 0;
  }

  .gl-amount {
    font-weight: 600;
    color: #137333;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
  }


  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #5f6368;
  }

  .empty-state-icon {
    font-size: 36px;
    color: #dadce0;
    margin-bottom: 12px;
  }

  .empty-state-text {
    font-size: 14px;
    font-weight: 400;
    margin: 0;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('inventory-form-tab-styles')) {
  const style = document.createElement('style');
  style.id = 'inventory-form-tab-styles';
  style.textContent = tabStyles;
  document.head.appendChild(style);
}

const InventoryForm = React.memo(({ recordType, mode = 'new' }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { loading: dynamicLoading, error: dynamicError, fetchFormConfiguration } = useDynamicForm();
  const {
    createOrUpdateInventoryDetail,
    getQuantityAvailable,
    bulkSetInventoryQuantity,
    checkInventoryDetailExists
  } = useInventoryDetail();

  // Inventory forms use direct API calls; no transaction hooks required

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
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);

  // GL Impact data and tabs for InventoryAdjustment
  const [activeTab, setActiveTab] = useState('items');
  const [glImpactData, setGlImpactData] = useState([]);
  const [glImpactLoading, setGlImpactLoading] = useState(false);

  // Refs for cleanup
  const notificationTimerRef = React.useRef(null);

  // Navigation paths for inventory transactions
  const navigationPaths = {
    InventoryAdjustment: '/inventory-adjustment',
    InventoryTransfer: '/inventory-transfer'
  };

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
      return data.results || [];
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
      return data.results || [];
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

      const response = await fetch(buildUrl(apiConfig.endpoints.customFieldValueByTypeAndRecord(typeOfRecordId, recordId)), {
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
            if (convertedValue === null || convertedValue === undefined || convertedValue === '') {
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

  // Fetch GL Impact data for InventoryAdjustment
  const fetchGLImpactData = useCallback(async (recordId) => {
    if (!recordId || recordType !== 'InventoryAdjustment') {
      return [];
    }

    try {
      setGlImpactLoading(true);

      const response = await fetch(buildUrl(`/journal-entry-line/by-record-id/${recordId}`), {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (response.ok) {
        const glData = await response.json();
        return Array.isArray(glData) ? glData : [];
      } else if (response.status !== 404) {
        console.warn(`Failed to fetch GL Impact data: ${response.status}`);
      }

      return [];
    } catch (err) {
      console.error('Error fetching GL Impact data:', err);
      return [];
    } finally {
      setGlImpactLoading(false);
    }
  }, [recordType]);

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
          initialData[field.name] = 0;
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

  // Generate sequence number for new records
  const generateSequenceNumberForNewRecord = async (config, typeOfRecordId) => {
    try {
      // Check if the form has a sequenceNumber field
      const hasSequenceNumberField = config?.standardFields?.some(field => field.name === 'sequenceNumber');
      if (!hasSequenceNumberField) {
        return; // No sequence number field, skip generation
      }

      // For transaction forms, we need to find the appropriate form based on record type
      // First, try to get forms for this record type
      const formsResponse = await fetch(buildUrl(apiConfig.endpoints.formByRecordType(typeOfRecordId)), {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (formsResponse.ok) {
        const formsData = await formsResponse.text().then(text => text.trim() ? JSON.parse(text) : []);
        const forms = Array.isArray(formsData) ? formsData : [];

        if (forms.length > 0) {
          // Use the first available form for this record type
          const defaultForm = forms[0];

          // Fetch sequence data for this form
          const sequenceResponse = await fetch(buildUrl(apiConfig.endpoints.formSequenceByForm(defaultForm.id)), {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
          });

          if (sequenceResponse.ok) {
            const sequenceDataArray = await sequenceResponse.text().then(text => text.trim() ? JSON.parse(text) : []);
            const sequenceData = Array.isArray(sequenceDataArray) && sequenceDataArray.length > 0
              ? sequenceDataArray[0]
              : { formSequenceNumber: 0 };

            const prefix = defaultForm.prefix || '';
            const nextSequenceNumber = (sequenceData.formSequenceNumber || 0) + 1;
            const generatedSequenceNumber = `${prefix}${String(nextSequenceNumber).padStart(4, '0')}`;

            // Set the generated sequence number in form data
            setFormData(prev => ({
              ...prev,
              sequenceNumber: generatedSequenceNumber,
              form: defaultForm.id // Also set the form if it exists in the config
            }));

            // Set the selected form ID for UI
            setSelectedFormId(defaultForm.id);

            console.log(`Generated sequence number: ${generatedSequenceNumber} for ${recordType}`);
          }
        }
      }
    } catch (error) {
      console.error('Error generating sequence number:', error);
      // Don't throw error - sequence number generation is not critical for form functionality
    }
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

        // Note: Sequence number generation is now handled when a form is selected
        // This prevents automatic generation on form load

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
              const response = await fetch(buildUrl(apiConfig.endpoints.formByTypeOfRecord(typeOfRecordId)), {
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
          // Fetch existing record for inventory transactions
          try {
            let record = {};
            switch (recordType) {
              case 'InventoryAdjustment': {
                const resp = await fetch(buildUrl(`/inventory-adjustment/${id}`), {
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                });
                if (resp.ok) record = await resp.json();
                break;
              }
              case 'InventoryTransfer': {
                const resp = await fetch(buildUrl(`/inventory-transfer/${id}`), {
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                });
                if (resp.ok) record = await resp.json();
                break;
              }
              default:
                console.warn(`No fetch method available for record type: ${recordType}`);
                record = {};
            }

            if (!isMounted) return;

            // Handle the record data structure
            const recordData = record?.data || record || {};

            if (recordData && Object.keys(recordData).length > 0) {
              const mergedData = { ...initialFormData };

              // Assign standard fields from config with proper type conversion
              config.standardFields.forEach(field => {
                if (recordData[field.name] !== undefined) {
                  let fieldValue = recordData[field.name];

                  // Convert string dates to Date objects for DatePicker components
                  // Check for various date field type names and common date field names
                  const isDateField = field.fieldTypeName === 'DatePicker' ||
                    field.fieldTypeName === 'Date' ||
                    field.fieldTypeName === 'date' ||
                    field.name.toLowerCase().includes('date') ||
                    field.name === 'soDate' ||
                    field.name === 'invoiceDate' ||
                    field.name === 'deliveryDate';

                  if (isDateField && fieldValue && typeof fieldValue === 'string') {
                    // Parse ISO date string to Date object
                    const parsedDate = new Date(fieldValue);
                    // Only use parsed date if it's valid
                    fieldValue = isNaN(parsedDate.getTime()) ? null : parsedDate;
                    console.log(`DEBUG: Converted date field ${field.name} from string "${recordData[field.name]}" to Date object:`, fieldValue);
                  }

                  mergedData[field.name] = fieldValue;
                }
              });

              // Also assign any additional fields that exist in the record but not in config
              // This ensures fields like 'form' and 'sequenceNumber' are preserved
              // But don't overwrite fields that were already processed in the standard fields loop
              const processedStandardFieldNames = config.standardFields.map(field => field.name);
              Object.keys(recordData).forEach(fieldName => {
                if (recordData[fieldName] !== undefined && !processedStandardFieldNames.includes(fieldName)) {
                  mergedData[fieldName] = recordData[fieldName];
                }
              });

              setFormData(mergedData);

              // Set selectedLocation from loaded transaction data
              if (recordType === 'InventoryTransfer' && mergedData.fromLocation) {
                console.log('DEBUG: Setting selectedLocation from loaded fromLocation data:', mergedData.fromLocation);
                setSelectedLocation(mergedData.fromLocation);

                // Also set toLocation for InventoryTransfer
                if (mergedData.toLocation) {
                  console.log('DEBUG: Setting toLocation from loaded toLocation data:', mergedData.toLocation);
                  setToLocation(mergedData.toLocation);
                }
              } else if (recordType === 'InventoryAdjustment' && mergedData.location) {
                console.log('DEBUG: Setting selectedLocation from loaded location data:', mergedData.location);
                setSelectedLocation(mergedData.location);
              }

              // Step 2: Load transaction line items (following FormCreator.js pattern)
              try {
                let lineItems = [];
                let lineItemsEndpoint = '';
                let lineItemsIdField = '';

                switch (recordType) {
                  case 'InventoryAdjustment':
                    lineItemsEndpoint = buildUrl(`/inventory-adjustment-line/by-adjustment/${id}`);
                    lineItemsIdField = 'inventoryAdjustmentId';
                    break;
                  case 'InventoryTransfer':
                    lineItemsEndpoint = buildUrl(`/inventory-transfer-line/by-transfer/${id}`);
                    lineItemsIdField = 'inventoryTransferId';
                    break;
                  default:
                    console.warn(`No line items endpoint configured for record type: ${recordType}`);
                }

                if (lineItemsEndpoint) {
                  console.log(`DEBUG: Loading line items from: ${lineItemsEndpoint}`);

                  const lineItemsResponse = await fetch(lineItemsEndpoint, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    }
                  });

                  if (lineItemsResponse.ok) {
                    const lineItemsData = await lineItemsResponse.json();
                    console.log(`DEBUG: Line items response:`, lineItemsData);

                    // Handle different API response formats
                    if (Array.isArray(lineItemsData)) {
                      lineItems = lineItemsData;
                    } else if (lineItemsData.results && Array.isArray(lineItemsData.results)) {
                      lineItems = lineItemsData.results;
                    } else if (lineItemsData.data && Array.isArray(lineItemsData.data)) {
                      lineItems = lineItemsData.data;
                    } else if (lineItemsData.lines && Array.isArray(lineItemsData.lines)) {
                      lineItems = lineItemsData.lines;
                    } else {
                      // If response is an object with line items as properties, extract them
                      console.log('DEBUG: Checking for line items in object properties...');
                      const possibleArrays = Object.values(lineItemsData).filter(value => Array.isArray(value));
                      if (possibleArrays.length > 0) {
                        lineItems = possibleArrays[0]; // Take the first array found
                        console.log('DEBUG: Found array in object properties:', lineItems);
                      }
                    }

                    console.log(`DEBUG: Processed line items:`, lineItems);

                    // Add line items to form data so SalesItems component can display them
                    if (lineItems.length > 0) {


                      // Calculate amounts for each line item (since API might not have correct totals)
                      const processedLineItems = lineItems.map(item => {
                        return {
                          ...item
                        };
                      });

                      mergedData.items = processedLineItems;
                      setFormData({ ...mergedData });
                      console.log(`DEBUG: Added ${lineItems.length} line items to form data with calculated amounts`);
                    }
                  } else {
                    console.warn(`Failed to load line items: ${lineItemsResponse.status} ${lineItemsResponse.statusText}`);
                  }
                }
              } catch (lineItemsError) {
                console.error(`Error loading line items for ${recordType}:`, lineItemsError);
                // Don't throw - line items loading is not critical for form display
              }

              // If a form is already selected, load its custom fields
              if (recordData.form) {
                try {
                  const customFields = await fetchCustomFormFields(recordData.form);
                  if (!isMounted) return;

                  setCustomFormFields(customFields);
                  setSelectedFormId(recordData.form);

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
                  // Silent error handling for custom fields
                }
              }

              // Load GL Impact data for InventoryAdjustment in edit and view modes
              if ((mode === 'edit' || mode === 'view') && recordType === 'InventoryAdjustment') {
                try {
                  console.log('📊 Loading GL Impact data for InventoryAdjustment...');
                  const glImpactEntries = await fetchGLImpactData(id);
                  if (!isMounted) return;
                  setGlImpactData(glImpactEntries);
                  console.log(`✅ Loaded ${glImpactEntries.length} GL Impact entries`);
                } catch (err) {
                  console.error('Error loading GL Impact data:', err);
                  setGlImpactData([]);
                }
              } else {
                setGlImpactData([]);
              }
            } else {
              console.warn(`No data found for ${recordType} with ID: ${id}`);
              setFormData(initialFormData);
            }
          } catch (error) {
            console.error(`Error fetching ${recordType}:`, error);
            setFormData(initialFormData);
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

      if (field.isMandatory && (!value || value === '')) {
        errors[field.name] = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required`;
      }
      if (field.name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.name] = 'Please enter a valid email address';
      }
      if (field.name === 'phone' && value && !/^\d{10}$/.test(value.replace(/\D/g, ''))) {
        errors[field.name] = 'Phone number must be 10 digits';
      }
    });

    return errors;
  }, [formConfig]);

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

    return null;
  };

  // Helper function to create main record (header only)
  const createMainRecord = async (standardData, formValues) => {
    // Create header with default total amount (kept for consistency)
    const headerDataWithTotal = { ...standardData, totalAmount: standardData.totalAmount ?? 0 };
    console.log(`DEBUG: createMainRecord - Creating ${recordType} with data:`, headerDataWithTotal);

    try {
      // Generate and validate JV lines for InventoryAdjustment
      let validatedJvLines = null;
      if (recordType === 'InventoryAdjustment') {
        const lineItems = formValues.items || [];
        const totalAmount = standardData.totalAmount ?? 0;

        console.log('🔍 Generating JV lines for InventoryAdjustment...');
        const jvValidation = await generateJvLines(
          lineItems,
          standardData.form,
          totalAmount,
          recordType
        );

        if (!jvValidation.isValid) {
          alert(jvValidation.errorMessage);
          return;
        }

        if (!jvValidation.isValid) {
          throw new Error(jvValidation.errorMessage || 'Failed to generate journal entries');
        }

        validatedJvLines = jvValidation.jvLines;
        console.log('✅ JV lines validated successfully:', validatedJvLines.length, 'lines');
      }

      // Step 1: Create inventory header via endpoints
      let createdRecord;
      switch (recordType) {
        case 'InventoryAdjustment': {
          const url = buildUrl('/inventory-adjustment');
          console.log(`DEBUG: createMainRecord - POST to ${url}`);
          console.log(`DEBUG: createMainRecord - Request body:`, JSON.stringify(headerDataWithTotal, null, 2));

          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(cleanPayload(headerDataWithTotal))
          });

          console.log(`DEBUG: createMainRecord - Response status: ${resp.status} ${resp.statusText}`);
          console.log(`DEBUG: createMainRecord - Response headers:`, Object.fromEntries(resp.headers.entries()));

          if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`DEBUG: createMainRecord - Error response body:`, errorText);
            throw new Error(`Failed to create InventoryAdjustment: ${resp.status} - ${errorText}`);
          }

          createdRecord = await resp.json();
          console.log(`DEBUG: createMainRecord - Created record response:`, createdRecord);
          break;
        }
        case 'InventoryTransfer': {
          const url = buildUrl('/inventory-transfer');
          console.log(`DEBUG: createMainRecord - POST to ${url}`);
          console.log(`DEBUG: createMainRecord - Request body:`, JSON.stringify(headerDataWithTotal, null, 2));

          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(cleanPayload(headerDataWithTotal))
          });

          console.log(`DEBUG: createMainRecord - Response status: ${resp.status} ${resp.statusText}`);
          console.log(`DEBUG: createMainRecord - Response headers:`, Object.fromEntries(resp.headers.entries()));

          if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`DEBUG: createMainRecord - Error response body:`, errorText);
            throw new Error(`Failed to create InventoryTransfer: ${resp.status} - ${errorText}`);
          }

          createdRecord = await resp.json();
          console.log(`DEBUG: createMainRecord - Created record response:`, createdRecord);
          break;
        }
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }

      // Extract the record ID from the response
      let recordId = null;

      if (createdRecord?.id) {
        recordId = createdRecord.id;
      } else if (createdRecord?.data?.id) {
        recordId = createdRecord.data.id;
      } else if (typeof createdRecord === 'string') {
        recordId = createdRecord;
      } else {
        // Try to find any field that looks like an ID
        const possibleIdFields = Object.keys(createdRecord || {}).filter(key =>
          key.toLowerCase().includes('id')
        );

        if (possibleIdFields.length > 0) {
          recordId = createdRecord[possibleIdFields[0]];
        }
      }

      if (!recordId) {
        throw new Error(`${recordType} header created but no ID returned. Response: ${JSON.stringify(createdRecord)}`);
      }

      // Step 2: Create line items if they exist
      const lineItems = formValues.items || [];
      console.log('DEBUG: formValues received:', formValues);
      console.log('DEBUG: lineItems extracted:', lineItems);
      console.log('DEBUG: lineItems length:', lineItems.length);

      if (lineItems.length > 0) {
        console.log('DEBUG: Creating line items for recordId:', recordId);
        await createTransactionLineItems(recordId, lineItems);
        console.log('DEBUG: Line items created successfully');
      } else {
        console.log('DEBUG: No line items to create');
      }

      // Step 3: Process JV Lines for InventoryAdjustment
      if (recordType === 'InventoryAdjustment' && validatedJvLines) {
        console.log('📝 Processing JV lines for InventoryAdjustment...');
        const jvLinesWithRecordId = validatedJvLines.map(line => ({
          ...line,
          recordId: recordId,
          recordType: recordType,
          id: null // New records
        }));

        await processJournal(jvLinesWithRecordId, 'new', recordId, recordType);
        console.log('✅ JV lines processed successfully');
      }

      return recordId;
    } catch (error) {
      console.error(`Error creating ${recordType}:`, error);
      throw error;
    }
  };

  // Helper function to update transaction line items (exact FormCreator.js pattern)
  const updateTransactionLineItemsSimple = async (newLineItems) => {
    console.log('DEBUG: updateTransactionLineItemsSimple called with:', newLineItems.length, 'items');
    console.log('DEBUG: recordType:', recordType);
    console.log('DEBUG: selectedLocation:', selectedLocation);

    // Define API endpoints for each transaction type
    const transactionConfig = {
      InventoryAdjustment: {
        endpoint: buildUrl('/inventory-adjustment-line'),
        getEndpoint: buildUrl(`/inventory-adjustment-line/by-adjustment/${id}`),
        idField: 'inventoryAdjustmentID',
        quantityField: 'quantityAdjusted'
      },
      InventoryTransfer: {
        endpoint: buildUrl('/inventory-transfer-line'),
        getEndpoint: buildUrl(`/inventory-transfer-line/by-transfer/${id}`),
        idField: 'inventoryTransferID',
        quantityField: 'quantityTransfer'
      }
    };

    const config = transactionConfig[recordType];
    if (!config) {
      console.warn(`No line items configuration for record type: ${recordType}`);
      return;
    }

    try {
      // Step 1: Get existing line items from API (exact FormCreator.js pattern)
      const existingResponse = await fetch(config.getEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      let existingItems = [];
      if (existingResponse.ok) {
        const existingData = await existingResponse.json();
        if (Array.isArray(existingData)) {
          existingItems = existingData;
        } else if (existingData.results && Array.isArray(existingData.results)) {
          existingItems = existingData.results;
        } else {
          // Check for arrays in object properties
          const possibleArrays = Object.values(existingData).filter(value => Array.isArray(value));
          if (possibleArrays.length > 0) {
            existingItems = possibleArrays[0];
          }
        }
      }

      console.log('DEBUG: Existing items from API:', existingItems.length);

      // Step 2: Create maps for efficient lookup (exact FormCreator.js pattern)
      const existingItemsMap = new Map();
      existingItems.forEach(item => {
        if (item.id) {
          existingItemsMap.set(item.id, item);
        }
      });

      const newItemsMap = new Map();
      newLineItems.forEach(item => {
        if (item.id) {
          newItemsMap.set(item.id, item);
        }
      });

      // Step 3: Identify items to update, create, and delete (exact FormCreator.js pattern)
      const itemsToUpdate = [];
      const itemsToCreate = [];
      const itemsToDelete = [];

      // Check each new item
      newLineItems.forEach(newItem => {
        if (newItem.id && existingItemsMap.has(newItem.id)) {
          // Item exists - add to update list (we'll update all existing items)
          itemsToUpdate.push(newItem);
        } else {
          // Item doesn't exist - create it
          itemsToCreate.push(newItem);
        }
      });

      // Check for items to delete (exist in database but not in form)
      existingItems.forEach(existingItem => {
        if (existingItem.id && !newItemsMap.has(existingItem.id)) {
          itemsToDelete.push(existingItem);
        }
      });

      console.log('DEBUG: Items to update:', itemsToUpdate.length);
      console.log('DEBUG: Items to create:', itemsToCreate.length);
      console.log('DEBUG: Items to delete:', itemsToDelete.length);

      // Step 4: Build update payloads
      const updatePayloads = itemsToUpdate.map(item => {
        const linePayload = {
          id: item.id,
          [config.idField]: id,
          itemID: item.itemID || item.itemId,
          quantityInHand: parseFloat(item.quantityInHand || 0),
          [config.quantityField]: parseFloat(item.quantityAdjusted || item.quantityTransfer || 0),
          rate: parseFloat(item.rate || 0),
          totalAmount: parseFloat(item.amount || item.totalAmount || 0),
          reason: item.reason
        };

        console.log(`DEBUG: UPDATE line item ${item.itemID} payload:`, linePayload);
        return cleanPayload(linePayload);
      });

      // Step 5: Build create payloads
      const createPayloads = itemsToCreate.map(item => {
        const linePayload = {
          [config.idField]: id,
          itemID: item.itemID || item.itemId,
          quantityInHand: parseFloat(item.quantityInHand || 0),
          [config.quantityField]: parseFloat(item.quantityAdjusted || item.quantityTransfer || 0),
          rate: parseFloat(item.rate || 0),
          totalAmount: parseFloat(item.amount || item.totalAmount || 0),
          reason: item.reason
        };

        console.log(`DEBUG: CREATE line item ${item.itemID} payload:`, linePayload);
        return cleanPayload(linePayload);
      });

      // Step 6: Execute bulk UPDATE
      if (updatePayloads.length > 0) {
        console.log(`📤 Bulk updating ${updatePayloads.length} inventory line items...`);
        const bulkUpdatePayload = { lines: updatePayloads };

        const bulkUpdateResponse = await fetch(config.endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bulkUpdatePayload)
        });

        if (!bulkUpdateResponse.ok) {
          const errorText = await bulkUpdateResponse.text();
          throw new Error(`Failed to bulk update inventory line items: ${bulkUpdateResponse.status} - ${errorText}`);
        }

        console.log(`✅ Successfully bulk updated ${updatePayloads.length} inventory line items`);
      }

      // Step 7: Execute bulk CREATE
      if (createPayloads.length > 0) {
        console.log(`📤 Bulk creating ${createPayloads.length} inventory line items...`);
        const bulkCreatePayload = { lines: createPayloads };

        const bulkCreateResponse = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bulkCreatePayload)
        });

        if (!bulkCreateResponse.ok) {
          const errorText = await bulkCreateResponse.text();
          throw new Error(`Failed to bulk create inventory line items: ${bulkCreateResponse.status} - ${errorText}`);
        }

        console.log(`✅ Successfully bulk created ${createPayloads.length} inventory line items`);
      }

      // Step 8: Execute bulk DELETE
      if (itemsToDelete.length > 0) {
        const idsToDelete = itemsToDelete.map(item => item.id).filter(id => id);

        if (idsToDelete.length > 0) {
          console.log(`📤 Bulk deleting ${idsToDelete.length} inventory line items...`);
          const bulkDeletePayload = { ids: idsToDelete };

          const bulkDeleteResponse = await fetch(config.endpoint, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bulkDeletePayload)
          });

          if (!bulkDeleteResponse.ok) {
            const errorText = await bulkDeleteResponse.text();
            throw new Error(`Failed to bulk delete inventory line items: ${bulkDeleteResponse.status} - ${errorText}`);
          }

          console.log(`✅ Successfully bulk deleted ${idsToDelete.length} inventory line items`);
        }
      }

      console.log('DEBUG: All line item operations completed successfully');

      // Handle inventory detail updates for InventoryAdjustment and InventoryTransfer in edit mode
      console.log('🔍 DEBUG: Checking inventory update conditions:');
      console.log('🔍 DEBUG: recordType:', recordType);
      console.log('🔍 DEBUG: selectedLocation exists:', !!selectedLocation);
      console.log('🔍 DEBUG: selectedLocation value:', selectedLocation);

      // Handle InventoryAdjustment edit mode
      if (recordType === 'InventoryAdjustment' && selectedLocation) {
        console.log('✅ DEBUG: INVENTORY ADJUSTMENT UPDATE CONDITIONS MET - Processing inventory detail updates for edit mode');
        console.log('DEBUG: selectedLocation:', selectedLocation);
        console.log('DEBUG: itemsToDelete:', itemsToDelete.length);
        console.log('DEBUG: itemsToUpdate:', itemsToUpdate.length);
        console.log('DEBUG: itemsToCreate:', itemsToCreate.length);

        // Step 1: Reverse inventory for deleted items (BULK)
        if (itemsToDelete.length > 0) {
          try {
            const locationId = selectedLocation?.value || selectedLocation;
            console.log(`🔄 Bulk reversing inventory for ${itemsToDelete.length} deleted items`);

            // Collect all inventory updates
            const inventoryUpdates = [];
            for (const deletedItem of itemsToDelete) {
              const itemId = deletedItem.itemID || deletedItem.itemId;
              const originalQuantity = parseFloat(deletedItem.quantityAdjusted || 0);

              if (itemId && locationId && originalQuantity !== 0) {
                // Check current inventory and calculate new absolute quantity
                const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
                if (inventoryDetail) {
                  const currentQty = Number(inventoryDetail.quantityAvailable || 0);
                  const newQty = currentQty - originalQuantity; // Reverse the adjustment

                  inventoryUpdates.push({
                    itemId: itemId,
                    locationId: locationId,
                    quantity: newQty
                  });

                  console.log(`Prepared reversal for item ${itemId}: ${currentQty} → ${newQty}`);
                }
              }
            }

            // Execute bulk update
            if (inventoryUpdates.length > 0) {
              await bulkSetInventoryQuantity(inventoryUpdates);
              console.log(`✅ Bulk reversed inventory for ${inventoryUpdates.length} deleted items`);
            }
          } catch (inventoryError) {
            console.error(`❌ Failed to bulk reverse inventory for deleted items:`, inventoryError.message);
          }
        }

        // Step 2: Update inventory for modified items (BULK - calculate difference)
        if (itemsToUpdate.length > 0) {
          try {
            const locationId = selectedLocation?.value || selectedLocation;
            console.log(`🔄 Bulk updating inventory for ${itemsToUpdate.length} modified items`);

            // Collect all inventory updates
            const inventoryUpdates = [];
            for (const updatedItem of itemsToUpdate) {
              const itemId = updatedItem.itemID || updatedItem.itemId;
              const newQuantity = parseFloat(updatedItem.quantityAdjusted || 0);

              // Find the original item to calculate the difference
              const originalItem = existingItems.find(item => item.id === updatedItem.id);
              const originalQuantity = parseFloat(originalItem?.quantityAdjusted || 0);
              const quantityDifference = newQuantity - originalQuantity;

              console.log(`DEBUG: Inventory calculation for item ${itemId}:`);
              console.log(`DEBUG: - originalQuantity: ${originalQuantity}`);
              console.log(`DEBUG: - newQuantity: ${newQuantity}`);
              console.log(`DEBUG: - quantityDifference: ${quantityDifference}`);

              if (itemId && locationId && quantityDifference !== 0) {
                // Check current inventory and calculate new absolute quantity
                const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
                if (inventoryDetail) {
                  const currentQty = Number(inventoryDetail.quantityAvailable || 0);
                  const newQty = currentQty + quantityDifference; // Apply the difference

                  inventoryUpdates.push({
                    itemId: itemId,
                    locationId: locationId,
                    quantity: newQty
                  });

                  console.log(`Prepared update for item ${itemId}: ${currentQty} → ${newQty} (diff: ${quantityDifference})`);
                } else {
                  console.log(`⏭️ No existing inventory for item ${itemId}, skipping`);
                }
              } else {
                console.log(`⏭️ Skipping inventory update for item ${itemId}: no change (difference: ${quantityDifference})`);
              }
            }

            // Execute bulk update
            if (inventoryUpdates.length > 0) {
              await bulkSetInventoryQuantity(inventoryUpdates);
              console.log(`✅ Bulk updated inventory for ${inventoryUpdates.length} modified items`);
            }
          } catch (inventoryError) {
            console.error(`❌ Failed to bulk update inventory for modified items:`, inventoryError.message);
          }
        }

        // Step 3: Add inventory for newly created items (BULK)
        if (itemsToCreate.length > 0) {
          try {
            const locationId = selectedLocation?.value || selectedLocation;
            console.log(`🔄 Bulk adding inventory for ${itemsToCreate.length} newly created items`);

            // Collect all inventory updates
            const inventoryUpdates = [];
            for (const createdItem of itemsToCreate) {
              const itemId = createdItem.itemID || createdItem.itemId;
              const quantity = parseFloat(createdItem.quantityAdjusted || 0);

              if (itemId && locationId && quantity !== 0) {
                // Check current inventory and calculate new absolute quantity
                const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
                const currentQty = inventoryDetail ? Number(inventoryDetail.quantityAvailable || 0) : 0;
                const newQty = currentQty + quantity; // Add the adjustment

                inventoryUpdates.push({
                  itemId: itemId,
                  locationId: locationId,
                  quantity: newQty
                });

                console.log(`Prepared addition for new item ${itemId}: ${currentQty} → ${newQty} (adjustment: ${quantity})`);
              }
            }

            // Execute bulk update
            if (inventoryUpdates.length > 0) {
              await bulkSetInventoryQuantity(inventoryUpdates);
              console.log(`✅ Bulk added inventory for ${inventoryUpdates.length} newly created items`);
            }
          } catch (inventoryError) {
            console.error(`❌ Failed to bulk add inventory for newly created items:`, inventoryError.message);
          }
        }
      }

      // Handle InventoryTransfer edit mode with two API calls
      else if (recordType === 'InventoryTransfer' && selectedLocation && toLocation) {
        console.log('✅ DEBUG: INVENTORY TRANSFER UPDATE CONDITIONS MET - Processing inventory detail updates for edit mode');
        console.log('DEBUG: fromLocation (selectedLocation):', selectedLocation);
        console.log('DEBUG: toLocation:', toLocation);
        console.log('DEBUG: itemsToDelete:', itemsToDelete.length);
        console.log('DEBUG: itemsToUpdate:', itemsToUpdate.length);
        console.log('DEBUG: itemsToCreate:', itemsToCreate.length);

        // Process all transfer operations in BULK
        try {
          const fromLocationId = selectedLocation?.value || selectedLocation;
          const toLocationId = toLocation?.value || toLocation;
          console.log(`🔄 Bulk processing ${itemsToDelete.length + itemsToUpdate.length + itemsToCreate.length} transfer operations`);

          const fromLocationUpdates = [];
          const toLocationUpdates = [];

          // Step 1: Reverse transfer for deleted items
          for (const deletedItem of itemsToDelete) {
            const itemId = deletedItem.itemID || deletedItem.itemId;
            const originalQuantity = parseFloat(deletedItem.quantityTransfer || 0);

            if (itemId && fromLocationId && toLocationId && originalQuantity !== 0) {
              // Add back to fromLocation
              const fromInventory = await checkInventoryDetailExists(itemId, fromLocationId);
              const fromCurrentQty = fromInventory ? Number(fromInventory.quantityAvailable || 0) : 0;
              fromLocationUpdates.push({
                itemId: itemId,
                locationId: fromLocationId,
                quantity: fromCurrentQty + originalQuantity
              });

              // Remove from toLocation
              const toInventory = await checkInventoryDetailExists(itemId, toLocationId);
              const toCurrentQty = toInventory ? Number(toInventory.quantityAvailable || 0) : 0;
              toLocationUpdates.push({
                itemId: itemId,
                locationId: toLocationId,
                quantity: toCurrentQty - originalQuantity
              });

              console.log(`Prepared reversal for deleted transfer ${itemId}: from ${fromCurrentQty} → ${fromCurrentQty + originalQuantity}, to ${toCurrentQty} → ${toCurrentQty - originalQuantity}`);
            }
          }

          // Step 2: Update transfer for modified items
          for (const updatedItem of itemsToUpdate) {
            const itemId = updatedItem.itemID || updatedItem.itemId;
            const newQuantity = parseFloat(updatedItem.quantityTransfer || 0);

            const originalItem = existingItems.find(item => item.id === updatedItem.id);
            const originalQuantity = parseFloat(originalItem?.quantityTransfer || 0);
            const quantityDifference = newQuantity - originalQuantity;

            console.log(`DEBUG: Transfer calculation for item ${itemId}: diff ${quantityDifference}`);

            if (itemId && fromLocationId && toLocationId && quantityDifference !== 0) {
              // Subtract difference from fromLocation
              const fromInventory = await checkInventoryDetailExists(itemId, fromLocationId);
              const fromCurrentQty = fromInventory ? Number(fromInventory.quantityAvailable || 0) : 0;
              fromLocationUpdates.push({
                itemId: itemId,
                locationId: fromLocationId,
                quantity: fromCurrentQty - quantityDifference
              });

              // Add difference to toLocation
              const toInventory = await checkInventoryDetailExists(itemId, toLocationId);
              const toCurrentQty = toInventory ? Number(toInventory.quantityAvailable || 0) : 0;
              toLocationUpdates.push({
                itemId: itemId,
                locationId: toLocationId,
                quantity: toCurrentQty + quantityDifference
              });

              console.log(`Prepared update for transfer ${itemId}: from ${fromCurrentQty} → ${fromCurrentQty - quantityDifference}, to ${toCurrentQty} → ${toCurrentQty + quantityDifference}`);
            }
          }

          // Step 3: Add transfer for newly created items
          for (const createdItem of itemsToCreate) {
            const itemId = createdItem.itemID || createdItem.itemId;
            const quantity = parseFloat(createdItem.quantityTransfer || 0);

            if (itemId && fromLocationId && toLocationId && quantity !== 0) {
              // Subtract from fromLocation
              const fromInventory = await checkInventoryDetailExists(itemId, fromLocationId);
              const fromCurrentQty = fromInventory ? Number(fromInventory.quantityAvailable || 0) : 0;
              fromLocationUpdates.push({
                itemId: itemId,
                locationId: fromLocationId,
                quantity: fromCurrentQty - quantity
              });

              // Add to toLocation
              const toInventory = await checkInventoryDetailExists(itemId, toLocationId);
              const toCurrentQty = toInventory ? Number(toInventory.quantityAvailable || 0) : 0;
              toLocationUpdates.push({
                itemId: itemId,
                locationId: toLocationId,
                quantity: toCurrentQty + quantity
              });

              console.log(`Prepared new transfer ${itemId}: from ${fromCurrentQty} → ${fromCurrentQty - quantity}, to ${toCurrentQty} → ${toCurrentQty + quantity}`);
            }
          }

          // Execute bulk updates for both locations
          if (fromLocationUpdates.length > 0 || toLocationUpdates.length > 0) {
            const allUpdates = [...fromLocationUpdates, ...toLocationUpdates];
            await bulkSetInventoryQuantity(allUpdates);
            console.log(`✅ Bulk processed ${fromLocationUpdates.length + toLocationUpdates.length} transfer inventory updates`);
          }
        } catch (inventoryError) {
          console.error(`❌ Failed to bulk process transfer operations:`, inventoryError.message);
        }
      } else {
        console.log('❌ DEBUG: INVENTORY UPDATE CONDITIONS NOT MET');
        console.log('❌ DEBUG: recordType:', recordType);
        console.log('❌ DEBUG: selectedLocation exists:', !!selectedLocation);
        console.log('❌ DEBUG: toLocation exists:', !!toLocation);
      }

    } catch (error) {
      console.error(`Error updating line items for ${recordType}:`, error);
      throw error;
    }
  };

  // Helper function to create transaction line items
  const createTransactionLineItems = async (headerId, lineItems) => {
    console.log('DEBUG: createTransactionLineItems called with:', { headerId, lineItems, recordType });
    console.log('=== LINE ITEMS SAVE - CREATE MODE ===');
    console.log('Header ID:', headerId);
    console.log('Record Type:', recordType);
    console.log('Number of line items to create:', lineItems.length);
    console.log('Raw line items data:', JSON.stringify(lineItems, null, 2));

    // Define API endpoints and field mappings for each transaction type
    const transactionConfig = {
      InventoryAdjustment: {
        endpoint: buildUrl('/inventory-adjustment-line'),
        idField: 'inventoryAdjustmentID',
        quantityField: 'quantityAdjusted'
      },
      InventoryTransfer: {
        endpoint: buildUrl('/inventory-transfer-line'),
        idField: 'inventoryTransferID',
        quantityField: 'quantityTransfer'
      }
    };

    const config = transactionConfig[recordType];
    console.log('DEBUG: Using config for', recordType, ':', config);

    if (!config) {
      throw new Error(`Unsupported record type: ${recordType}`);
    }

    // Build all line payloads for bulk creation
    const linesToCreate = lineItems.map((line, index) => {
      console.log(`DEBUG: line ${index + 1}:`, line);
      const quantity = Number(line.quantityAdjusted || line.quantityTransfer || 0);
      const rate = Number(line.rate || 0);

      // Build line payload based on transaction type
      const linePayload = {
        [config.idField]: headerId,
        itemID: line.itemID?.value || line.itemID,
        quantityInHand: Number(line.quantityInHand || 0),
        [config.quantityField]: quantity,
        rate,
        totalAmount: line.totalAmount || 0,
        reason: line.reason
      };

      console.log(`DEBUG: Building line ${index + 1} payload:`, linePayload);
      return cleanPayload(linePayload);
    });

    // Execute bulk POST
    if (linesToCreate.length > 0) {
      console.log(`📤 Bulk creating ${linesToCreate.length} inventory line items...`);
      const bulkCreatePayload = { lines: linesToCreate };
      console.log(`DEBUG: Sending to endpoint:`, config.endpoint);

      const bulkCreateResponse = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(bulkCreatePayload)
      });

      console.log(`DEBUG: Bulk create response status:`, bulkCreateResponse.status);

      if (!bulkCreateResponse.ok) {
        const errorData = await bulkCreateResponse.text();
        console.log(`DEBUG: Bulk create error:`, errorData);
        throw new Error(`Failed to bulk create inventory line items: ${bulkCreateResponse.status} - ${errorData}`);
      }

      const result = await bulkCreateResponse.json();
      console.log(`✅ Successfully bulk created ${linesToCreate.length} inventory line items`);

      // Process inventory updates after successful bulk creation
      // Collect all inventory updates to process in bulk
      if (recordType === 'InventoryAdjustment' && selectedLocation) {
        const inventoryUpdates = [];

        for (const line of lineItems) {
          const quantity = Number(line.quantityAdjusted || 0);
          if (quantity === 0) continue;

          const itemId = line.itemID?.value || line.itemID;
          const locationId = selectedLocation?.value || selectedLocation;

          if (itemId && locationId) {
            try {
              // Check current inventory and calculate new absolute quantity
              const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
              const currentQty = Number(inventoryDetail?.quantityAvailable || 0);
              const newQty = currentQty + quantity;

              inventoryUpdates.push({
                itemId: itemId,
                locationId: locationId,
                quantity: newQty
              });

              console.log(`Prepared inventory update for item ${itemId}: ${currentQty} + ${quantity} = ${newQty}`);
            } catch (error) {
              console.error(`❌ Failed to prepare inventory update for item ${line.itemID}:`, error.message);
            }
          } else {
            console.warn(`⚠️ Missing itemId (${itemId}) or locationId (${locationId}) for inventory update`);
          }
        }

        // Execute bulk update
        if (inventoryUpdates.length > 0) {
          try {
            console.log(`📤 Bulk updating inventory for ${inventoryUpdates.length} items in create mode`);
            await bulkSetInventoryQuantity(inventoryUpdates);
            console.log(`✅ Successfully bulk updated inventory for ${inventoryUpdates.length} items`);
          } catch (inventoryError) {
            console.error(`❌ Failed to bulk update inventory:`, inventoryError.message);
            // Don't throw here - we want the line item creation to succeed even if inventory update fails
          }
        }
      }

      // For inventory transfers, update both fromLocation and toLocation
      if (recordType === 'InventoryTransfer' && selectedLocation && toLocation) {
        const fromLocationUpdates = [];
        const toLocationUpdates = [];

        for (const line of lineItems) {
          const quantity = Number(line.quantityTransfer || 0);
          if (quantity === 0) continue;

          const itemId = line.itemID?.value || line.itemID;
          const fromLocationId = selectedLocation?.value || selectedLocation;
          const toLocationId = toLocation?.value || toLocation;

          if (itemId && fromLocationId && toLocationId) {
            try {
              console.log(`🔄 Preparing inventory transfer for item ${itemId}: ${quantity} units`);

              // Check and calculate fromLocation (subtract)
              const fromInventory = await checkInventoryDetailExists(itemId, fromLocationId);
              const currentFromQty = Number(fromInventory?.quantityAvailable || 0);
              const newFromQty = currentFromQty - quantity;

              fromLocationUpdates.push({
                itemId: itemId,
                locationId: fromLocationId,
                quantity: newFromQty
              });

              console.log(`   From: ${fromLocationId} (${currentFromQty} - ${quantity} = ${newFromQty})`);

              // Check and calculate toLocation (add)
              const toInventory = await checkInventoryDetailExists(itemId, toLocationId);
              const currentToQty = Number(toInventory?.quantityAvailable || 0);
              const newToQty = currentToQty + quantity;

              toLocationUpdates.push({
                itemId: itemId,
                locationId: toLocationId,
                quantity: newToQty
              });

              console.log(`   To: ${toLocationId} (${currentToQty} + ${quantity} = ${newToQty})`);
            } catch (error) {
              console.error(`❌ Failed to prepare transfer for item ${line.itemID}:`, error.message);
            }
          } else {
            console.warn(`⚠️ Missing data for inventory transfer:`, {
              itemId,
              fromLocationId,
              toLocationId
            });
          }
        }

        // Execute bulk updates for both locations
        try {
          if (fromLocationUpdates.length > 0) {
            console.log(`📤 Bulk updating fromLocation inventory for ${fromLocationUpdates.length} items`);
            await bulkSetInventoryQuantity(fromLocationUpdates);
            console.log(`✅ Successfully bulk updated fromLocation inventory`);
          }

          if (toLocationUpdates.length > 0) {
            console.log(`📥 Bulk updating toLocation inventory for ${toLocationUpdates.length} items`);
            await bulkSetInventoryQuantity(toLocationUpdates);
            console.log(`✅ Successfully bulk updated toLocation inventory`);
          }

          if (fromLocationUpdates.length > 0 || toLocationUpdates.length > 0) {
            console.log(`🎉 Inventory transfers completed successfully in bulk`);
          }
        } catch (inventoryError) {
          console.error(`❌ Failed to bulk process inventory transfers:`, inventoryError.message);
          // Don't throw here - we want the line item creation to succeed even if inventory update fails
        }
      }

      return result;
    }

    return [];
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

      const bulkCreateResponse = await fetch(buildUrl(apiConfig.endpoints.customFieldValue), {
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

      const bulkUpdateResponse = await fetch(buildUrl(apiConfig.endpoints.customFieldValue), {
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

      const bulkCreateResponse = await fetch(buildUrl(apiConfig.endpoints.customFieldValue), {
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
    // Stage 1: Update the main record with standard data
    const headerPayload = { ...standardData, id };
    try {
      switch (recordType) {
        case 'InventoryAdjustment': {
          const resp = await fetch(buildUrl(apiConfig.endpoints.inventoryAdjustmentById(id)), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(cleanPayload(headerPayload))
          });
          if (!resp.ok) throw new Error(`Failed to update InventoryAdjustment: ${resp.status}`);
          break;
        }
        case 'InventoryTransfer': {
          const resp = await fetch(buildUrl(apiConfig.endpoints.inventoryTransferById(id)), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(cleanPayload(headerPayload))
          });
          if (!resp.ok) throw new Error(`Failed to update InventoryTransfer: ${resp.status}`);
          break;
        }
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }
    } catch (error) {
      console.error(`Error updating ${recordType}:`, error);
      throw error;
    }

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

  // Helper function to validate inventory quantities before submission
  const validateInventoryQuantities = (items) => {
    if (!items || items.length === 0) {
      return { isValid: true };
    }

    for (const item of items) {
      const qtyInHand = Number(item.quantityInHand || 0);

      if (recordType === 'InventoryAdjustment') {
        const qtyAdjusted = Number(item.quantityAdjusted || 0);
        const newQuantity = qtyInHand + qtyAdjusted;

        if (newQuantity < 0) {
          return {
            isValid: false,
            message: `Cannot save. Item adjustment would result in negative inventory (Current: ${qtyInHand}, Adjustment: ${qtyAdjusted}, New: ${newQuantity}). Please adjust the quantities.`
          };
        }
      } else if (recordType === 'InventoryTransfer') {
        const qtyTransfer = Number(item.quantityTransfer || 0);

        if (qtyInHand <= 0) {
          return {
            isValid: false,
            message: `Cannot save. Item has zero or negative quantity in hand (${qtyInHand}). Please adjust the inventory first.`
          };
        }

        if (qtyTransfer > qtyInHand) {
          return {
            isValid: false,
            message: `Cannot save. Transfer quantity (${qtyTransfer}) exceeds available quantity (${qtyInHand}).`
          };
        }
      }
    }

    return { isValid: true };
  };

  // Main submit handler - optimized and clean
  const handleSubmit = async (formValues) => {
    try {
      setLoading(true);
      setError(null);

      // Validate inventory quantities before processing
      const validation = validateInventoryQuantities(formValues.items);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      const { standardData, customData } = separateFormData(formValues);
      const typeOfRecordId = getTypeOfRecordId();

      if (mode === 'new') {
        // Stage 1: Create main record
        const recordId = await createMainRecord(standardData, formValues);

        // Stage 2: Update form sequence (non-critical) - only if form field exists and form is selected
        const hasFormField = formConfig?.standardFields?.some(field => field.name === 'form');
       

        // Stage 3: Create custom field values
        await createCustomFieldValues(customData, recordId, typeOfRecordId);

        // Success notification
        showNotification(`${recordType} created successfully with ${Object.keys(customData).length} custom fields`, 'success');
      } else {
        // Update mode - following FormCreator.js exact pattern

        // Stage 1: Update main transaction record
        const customFieldCount = await updateRecord(standardData, customData, typeOfRecordId);

        // Stage 2: Handle line items updates (exact FormCreator.js pattern)
        if (formValues.items && formValues.items.length > 0) {
          console.log('DEBUG: Calling updateTransactionLineItemsSimple with items:', formValues.items.length);
          await updateTransactionLineItemsSimple(formValues.items);
        } else {
          console.log('DEBUG: No items to update in formValues.items');
        }

        // Stage 3: Update JV Lines for InventoryAdjustment
        if (recordType === 'InventoryAdjustment') {
          console.log('🔍 Regenerating JV lines for InventoryAdjustment edit...');
          const lineItems = formValues.items || [];
          const totalAmount = standardData.totalAmount ?? 0;

          const jvValidation = await generateJvLines(
            lineItems,
            standardData.form,
            totalAmount,
            recordType
          );


          if (!jvValidation.isValid) {
            alert(jvValidation.errorMessage);
            return;
          }

          if (!jvValidation.isValid) {
            throw new Error(jvValidation.errorMessage || 'Failed to generate journal entries');
          }

          try {
            const existingResponse = await fetch(`${apiConfig.baseURL}/journal-entry-line/by-record-id/${id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            let existingItems = [];
            if (existingResponse.ok) {
              const existingData = await existingResponse.json();
              if (Array.isArray(existingData)) {
                existingItems = existingData;
              }
            }

            if (existingItems.length > 0) {
              const changes = existingItems.map(item => ({
                jeid: id,
                id: item.id,
                accountId: item.account,
                memo: item.memo,
                newCredit: 0,
                newDebit: 0,
                oldCredit: Number(item.credit || 0),
                oldDebit: Number(item.debit || 0)
              }));
              console.log('🔄 Calling processJournal for delete operation with changes:', changes);
              await processJournal(changes, 'delete');
            }
          } catch (error) {
            console.error('Error deleting journal entry lines:', error);
          }

          const jvLinesWithRecordId = jvValidation.jvLines.map(line => ({
            ...line,
            recordId: id,
            recordType: recordType,
            id: null
          }));

          console.log('🔄 [PurchaseForm Edit] Creating new validated JV lines:', jvLinesWithRecordId);
          await processJournal(jvLinesWithRecordId, 'new', id, recordType);

          console.log('✅ JV lines updated successfully');
        }

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

  // Helper function to delete transaction line items
  const deleteTransactionLineItems = async (headerId) => {
    try {
      // Get line items endpoint based on transaction type
      let lineItemsEndpoint;
      let deleteEndpoint;

      switch (recordType) {
        case 'InventoryAdjustment':
          lineItemsEndpoint = `/inventory-adjustment-line/by-adjustment/${headerId}`;
          deleteEndpoint = '/inventory-adjustment-line';
          break;
        case 'InventoryTransfer':
          lineItemsEndpoint = `/inventory-transfer-line/by-transfer/${headerId}`;
          deleteEndpoint = '/inventory-transfer-line';
          break;
        default:
          throw new Error(`Unsupported record type for line items: ${recordType}`);
      }

      // Fetch existing line items for this transaction
      const response = await fetch(buildUrl(lineItemsEndpoint), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch line items for deletion: ${response.status}`);
        return; // Continue with header deletion even if line items fetch fails
      }

      const lineItemsData = await response.json();
      let lineItems = [];

      // Handle different API response formats (same as initial load)
      if (Array.isArray(lineItemsData)) {
        lineItems = lineItemsData;
      } else if (lineItemsData.results && Array.isArray(lineItemsData.results)) {
        lineItems = lineItemsData.results;
      } else if (lineItemsData.data && Array.isArray(lineItemsData.data)) {
        lineItems = lineItemsData.data;
      } else if (lineItemsData.lines && Array.isArray(lineItemsData.lines)) {
        lineItems = lineItemsData.lines;
      } else {
        // If response is an object with line items as properties, extract them
        const possibleArrays = Object.values(lineItemsData).filter(value => Array.isArray(value));
        if (possibleArrays.length > 0) {
          lineItems = possibleArrays[0]; // Take the first array found
        }
      }

      if (lineItems.length === 0) {
        console.log('No line items found to delete');
        return;
      }

      console.log(`🗑️ Deleting ${lineItems.length} line items and reversing inventory for ${recordType}`);

      // Step 1: Reverse inventory for all line items before deleting them
      if (recordType === 'InventoryAdjustment' && selectedLocation) {
        console.log('🔄 Reversing inventory adjustments before deletion');
        const inventoryUpdates = [];

        for (const lineItem of lineItems) {
          const itemId = lineItem.itemID || lineItem.itemId;
          const locationId = selectedLocation?.value || selectedLocation;
          const originalQuantity = parseFloat(lineItem.quantityAdjusted || 0);

          if (itemId && locationId && originalQuantity !== 0) {
            try {
              // Check current inventory and calculate new absolute quantity (reverse the adjustment)
              const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
              const currentQty = Number(inventoryDetail?.quantityAvailable || 0);
              const newQty = currentQty - originalQuantity;

              inventoryUpdates.push({
                itemId: itemId,
                locationId: locationId,
                quantity: newQty
              });

              console.log(`Prepared reversal for item ${itemId}: ${currentQty} - ${originalQuantity} = ${newQty}`);
            } catch (error) {
              console.error(`❌ Failed to prepare reversal for item ${lineItem.itemID}:`, error.message);
              // Continue with deletion even if inventory reversal fails
            }
          }
        }

        // Execute bulk update
        if (inventoryUpdates.length > 0) {
          try {
            console.log(`📤 Bulk reversing inventory for ${inventoryUpdates.length} items in delete mode`);
            await bulkSetInventoryQuantity(inventoryUpdates);
            console.log(`✅ Successfully bulk reversed inventory for ${inventoryUpdates.length} items`);
          } catch (inventoryError) {
            console.error(`❌ Failed to bulk reverse inventory:`, inventoryError.message);
            // Continue with deletion even if inventory reversal fails
          }
        }
      } else if (recordType === 'InventoryTransfer' && selectedLocation && toLocation) {
        console.log('🔄 Reversing inventory transfers before deletion');
        const fromLocationUpdates = [];
        const toLocationUpdates = [];

        for (const lineItem of lineItems) {
          const itemId = lineItem.itemID || lineItem.itemId;
          const fromLocationId = selectedLocation?.value || selectedLocation;
          const toLocationId = toLocation?.value || toLocation;
          const originalQuantity = parseFloat(lineItem.quantityTransfer || 0);

          if (itemId && fromLocationId && toLocationId && originalQuantity !== 0) {
            try {
              console.log(`🔄 Preparing reversal for transfer item ${itemId}: ${originalQuantity} units`);

              // Reverse fromLocation: Add back the quantity
              const fromInventory = await checkInventoryDetailExists(itemId, fromLocationId);
              const currentFromQty = Number(fromInventory?.quantityAvailable || 0);
              const newFromQty = currentFromQty + originalQuantity;

              fromLocationUpdates.push({
                itemId: itemId,
                locationId: fromLocationId,
                quantity: newFromQty
              });

              console.log(`   From: ${fromLocationId} (${currentFromQty} + ${originalQuantity} = ${newFromQty})`);

              // Reverse toLocation: Subtract the quantity
              const toInventory = await checkInventoryDetailExists(itemId, toLocationId);
              const currentToQty = Number(toInventory?.quantityAvailable || 0);
              const newToQty = currentToQty - originalQuantity;

              toLocationUpdates.push({
                itemId: itemId,
                locationId: toLocationId,
                quantity: newToQty
              });

              console.log(`   To: ${toLocationId} (${currentToQty} - ${originalQuantity} = ${newToQty})`);
            } catch (error) {
              console.error(`❌ Failed to prepare reversal for transfer item ${lineItem.itemID}:`, error.message);
              // Continue with deletion even if inventory reversal fails
            }
          }
        }

        // Execute bulk updates for both locations
        try {
          if (fromLocationUpdates.length > 0) {
            console.log(`📤 Bulk reversing fromLocation inventory for ${fromLocationUpdates.length} items`);
            await bulkSetInventoryQuantity(fromLocationUpdates);
            console.log(`✅ Successfully bulk reversed fromLocation inventory`);
          }

          if (toLocationUpdates.length > 0) {
            console.log(`📥 Bulk reversing toLocation inventory for ${toLocationUpdates.length} items`);
            await bulkSetInventoryQuantity(toLocationUpdates);
            console.log(`✅ Successfully bulk reversed toLocation inventory`);
          }

          if (fromLocationUpdates.length > 0 || toLocationUpdates.length > 0) {
            console.log(`🎉 Transfer reversals completed successfully in bulk`);
          }
        } catch (inventoryError) {
          console.error(`❌ Failed to bulk reverse inventory transfers:`, inventoryError.message);
          // Continue with deletion even if inventory reversal fails
        }
      }

      // Step 2: Delete all line items using bulk DELETE
      const idsToDelete = lineItems.map(item => item.id).filter(id => id);

      if (idsToDelete.length > 0) {
        const bulkDeletePayload = {
          ids: idsToDelete
        };

        console.log(`📤 [${recordType} Delete - Bulk Delete Lines] Sending ${idsToDelete.length} IDs:`, bulkDeletePayload);

        const bulkDeleteResponse = await fetch(buildUrl(deleteEndpoint), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(bulkDeletePayload)
        });

        if (!bulkDeleteResponse.ok) {
          const errorText = await bulkDeleteResponse.text();
          console.warn(`Failed to bulk delete line items: ${bulkDeleteResponse.status} - ${errorText}`);
        } else {
          console.log(`✅ Successfully bulk deleted ${idsToDelete.length} line items for ${recordType} ${headerId}`);
        }
      }

    } catch (error) {
      console.warn('Error deleting line items:', error);
      // Continue with header deletion even if line items deletion fails
    }
  };

  // Helper function to validate if deleting would result in negative inventory
  const validateDeleteInventory = async (lineItems) => {
    if (!lineItems || lineItems.length === 0) {
      return { isValid: true };
    }

    try {
      if (recordType === 'InventoryAdjustment' && selectedLocation) {
        // For adjustments, check if reversing would cause negative inventory
        for (const lineItem of lineItems) {
          const itemId = lineItem.itemID || lineItem.itemId;
          const locationId = selectedLocation?.value || selectedLocation;
          const originalQuantity = parseFloat(lineItem.quantityAdjusted || 0);

          if (itemId && locationId && originalQuantity !== 0) {
            // Get current quantity
            const currentQty = await getQuantityAvailable(itemId, locationId);
            // Calculate what quantity would be after reversal
            const qtyAfterReversal = currentQty - originalQuantity;

            if (qtyAfterReversal < 0) {
              return {
                isValid: false,
                message: `Cannot delete. Reversing adjustment for item would result in negative inventory (Current: ${currentQty}, After reversal: ${qtyAfterReversal}). Please adjust inventory first.`
              };
            }
          }
        }
      } else if (recordType === 'InventoryTransfer' && selectedLocation && toLocation) {
        // For transfers, check if reversing would cause negative inventory at destination
        for (const lineItem of lineItems) {
          const itemId = lineItem.itemID || lineItem.itemId;
          const toLocationId = toLocation?.value || toLocation;
          const originalQuantity = parseFloat(lineItem.quantityTransfer || 0);

          if (itemId && toLocationId && originalQuantity !== 0) {
            // Get current quantity at destination (where we transferred TO)
            const currentQtyAtDestination = await getQuantityAvailable(itemId, toLocationId);
            // To reverse transfer, we need to subtract from destination
            const qtyAfterReversal = currentQtyAtDestination - originalQuantity;

            if (qtyAfterReversal < 0) {
              return {
                isValid: false,
                message: `Cannot delete. Reversing transfer for item would result in negative inventory at destination (Current: ${currentQtyAtDestination}, After reversal: ${qtyAfterReversal}). Please adjust inventory first.`
              };
            }
          }
        }
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating delete inventory:', error);
      return {
        isValid: false,
        message: `Error validating inventory: ${error.message}`
      };
    }
  };

  // Helper function to delete custom field values for a record using bulk delete API
  const deleteCustomFieldValues = async (recordId, typeOfRecordId) => {
    if (!recordId || !typeOfRecordId) return;

    try {
      // Fetch all custom field values for this record
      const response = await fetch(buildUrl(`/custom-field-value/by-type-and-record?typeOfRecord=${typeOfRecordId}&recordId=${recordId}`), {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (response.ok) {
        const customFieldValues = await response.json();

        if (Array.isArray(customFieldValues) && customFieldValues.length > 0) {
          // Extract all IDs for bulk delete
          const idsToDelete = customFieldValues.map(cfv => cfv.id);

          // Use bulk delete API with { ids: [] } structure
          console.log(`🗑️ Bulk deleting ${idsToDelete.length} custom field values for ${recordType} ${recordId}...`);
          const deleteResponse = await fetch(buildUrl('/custom-field-value'), {
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

      // Validate that deletion won't result in negative inventory
      // First, fetch the line items for validation
      let lineItemsEndpoint;
      switch (recordType) {
        case 'InventoryAdjustment':
          lineItemsEndpoint = `/inventory-adjustment-line/by-adjustment/${id}`;
          break;
        case 'InventoryTransfer':
          lineItemsEndpoint = `/inventory-transfer-line/by-transfer/${id}`;
          break;
        default:
          break;
      }

      if (lineItemsEndpoint) {
        const response = await fetch(buildUrl(lineItemsEndpoint), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const lineItemsData = await response.json();
          let lineItems = [];

          // Handle different API response formats
          if (Array.isArray(lineItemsData)) {
            lineItems = lineItemsData;
          } else if (lineItemsData.results && Array.isArray(lineItemsData.results)) {
            lineItems = lineItemsData.results;
          } else if (lineItemsData.data && Array.isArray(lineItemsData.data)) {
            lineItems = lineItemsData.data;
          } else {
            const possibleArrays = Object.values(lineItemsData).filter(value => Array.isArray(value));
            if (possibleArrays.length > 0) {
              lineItems = possibleArrays[0];
            }
          }

          // Validate before deletion
          const validation = await validateDeleteInventory(lineItems);
          if (!validation.isValid) {
            setLoading(false);
            showNotification(validation.message, 'error');
            return;
          }
        }
      }

      // Step 1: Delete JV lines for InventoryAdjustment
      if (recordType === 'InventoryAdjustment') {
        console.log('🗑️ Deleting JV lines for InventoryAdjustment...');
        try {
          const existingResponse = await fetch(`${apiConfig.baseURL}/journal-entry-line/by-record-id/${id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          let existingItems = [];
          if (existingResponse.ok) {
            const existingData = await existingResponse.json();
            if (Array.isArray(existingData)) {
              existingItems = existingData;
            }
          }

          if (existingItems.length > 0) {
            const changes = existingItems.map(item => ({
              jeid: id,
              id: item.id,
              accountId: item.account,
              memo: item.memo,
              newCredit: 0,
              newDebit: 0,
              oldCredit: Number(item.credit || 0),
              oldDebit: Number(item.debit || 0)
            }));
            console.log('🔄 Calling processJournal for delete operation with changes:', changes);
            await processJournal(changes, 'delete');
          }
        } catch (error) {
          console.error('Error deleting journal entry lines:', error);
        }
      }

      // Step 2: Delete all line items
      await deleteTransactionLineItems(id);

      // Step 3: Delete custom field values
      const typeOfRecordId = getTypeOfRecordId();
      await deleteCustomFieldValues(id, typeOfRecordId);

      // Step 4: Delete the header record
      switch (recordType) {
        case 'InventoryAdjustment': {
          const resp = await fetch(buildUrl(apiConfig.endpoints.inventoryAdjustmentById(id)), { method: 'DELETE' });
          if (!resp.ok) throw new Error(`Failed to delete InventoryAdjustment: ${resp.status}`);
          break;
        }
        case 'InventoryTransfer': {
          const resp = await fetch(buildUrl(apiConfig.endpoints.inventoryTransferById(id)), { method: 'DELETE' });
          if (!resp.ok) throw new Error(`Failed to delete InventoryTransfer: ${resp.status}`);
          break;
        }
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }

      showNotification(`${recordType} deleted successfully!`, 'success');
      setDeleteDialogOpen(false);

      // Navigate back to the appropriate list page
      const navigationPath = navigationPaths[recordType] || '/';
      navigate(navigationPath);

    } catch (error) {
      console.error(`Error deleting ${recordType}:`, error);
      showNotification(`Failed to delete ${recordType}: ${error.message}`, 'error');
    } finally {
      setLoading(false);
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

  // Extract getDisplayText function to prevent infinite loops
  const getDisplayText = useCallback((obj, fieldName) => {
    const keys = Object.keys(obj);

    // Fall back to generic "name" field (but not formName for non-form dropdowns)
    if (obj.name) {
      return obj.name;
    }

    // Special handling for form dropdown - prioritize formName
    if (fieldName === 'form' && obj.formName) {
      return obj.formName;
    }

    // Priority 2: Common display fields
    const displayFields = ['title', 'description', 'label', 'displayName'];
    for (const field of displayFields) {
      if (obj[field]) return obj[field];
    }

    // Priority 3: Handle special cases with formatted text
    if (obj.accountName && obj.accountNumber) {
      return `${obj.accountNumber} - ${obj.accountName}`;
    }
    if (obj.itemName && obj.itemCode) {
      return `${obj.itemCode} - ${obj.itemName}`;
    }

    // Use formName if available for any dropdown
    if (obj.formName) {
      return obj.formName;
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
  }, []);

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

        const displayText = getDisplayText(item, fieldName);
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

        // Track location field changes for inventory items
        if (fieldName === 'location' || fieldName === 'fromLocation') {
          console.log(`📍 ${fieldName} selected:`, valueToPass);
          setSelectedLocation(valueToPass);
        }
        if (fieldName === 'toLocation') {
          console.log(`📍 ${fieldName} selected:`, valueToPass);
          setToLocation(valueToPass);
        }
      }
    };
  }, [dropdownData, handleFormSelection, setSelectedLocation]);

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
    const { validationMessage, touched, label, ...others } = fieldRenderProps;
    const showValidationMessage = touched && validationMessage;
    const commonProps = {
      ...others,
      className: showValidationMessage ? 'k-state-invalid' : '',
      style: { width: '100%' },
      disabled: mode === 'view' || others.disabled,

    };

    const componentProps = {
      text: { component: Input, props: commonProps },
      number: { component: NumericTextBox, props: { ...commonProps, min: 0, step: 0, spinners: false } },
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

    // Check if field is mandatory
    const isMandatory = field.isMandatory;

    return isMandatory ? `${label} *` : label;
  };

  const getFieldValidator = useCallback((field, formRenderProps = null) => {
    // Check if field is mandatory
    const isMandatory = field.isMandatory;

    if (!isMandatory) return undefined;
    return (value) => {
      if (!value || value === '') {
        return `${field.displayName || field.name} is required`;
      }
      if (field.name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      if (field.name === 'phone' && value && !/^\d{10}$/.test(value.replace(/\D/g, ''))) {
        return 'Phone number must be 10 digits';
      }
      return '';
    };
  }, []);

  const getCustomFieldValidator = (field) => {
    if (!field.isRequired) return undefined;
    return (value) => {
      if (!value || value === '') {
        return `${field.fieldLabel || field.fieldName} is required`;
      }
      return '';
    };
  };

  // Render GL Impact table for InventoryAdjustment
  const renderGLImpactTable = () => {
    if (glImpactLoading) {
      return (
        <div className="gl-impact-section">
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <p className="empty-state-text">Loading GL Impact data...</p>
          </div>
        </div>
      );
    }

    if (!glImpactData || glImpactData.length === 0) {
      return (
        <div className="gl-impact-section">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p className="empty-state-text">
              No GL Impact data found for this {recordType.toLowerCase()}.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="gl-impact-section">
        <table className="gl-impact-table">
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Memo</th>
            </tr>
          </thead>
          <tbody>
            {glImpactData.map((entry, index) => (
              <tr key={entry.id || index}>
                <td>{entry.accountName || ''}</td>
                <td>
                  <span className="gl-amount">
                    {entry.debit ? entry.debit.toFixed(2) : '0.00'}
                  </span>
                </td>
                <td>
                  <span className="gl-amount">
                    {entry.credit ? entry.credit.toFixed(2) : '0.00'}
                  </span>
                </td>
                <td>{entry.memo || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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

    // Dynamic field state logic
    const fieldDisabled = mode === 'view' || field.isDisabled;

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
          />
        </div>
      </div>
    );
  }, [mode, recordType, getFieldComponent, getFieldLabel, getFieldValidator, getCustomFieldValidator]);

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
          <Button onClick={() => navigate('/')}>
            Back to Dashboard
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
                {/* Standard Fields Section */}
                <div className="form-section">
                  <div className="section-header">
                    <h3 className="section-title">Standard Fields</h3>
                  </div>
                  <div className="master-form-row">
                    {renderFields(formConfig.standardFields, false, formRenderProps)}
                  </div>
                </div>

                {/* Custom Fields Section */}
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

                {/* Transaction Items Section with Tabs for InventoryAdjustment in edit/view mode */}
                {recordType === 'InventoryAdjustment' && (mode === 'edit' || mode === 'view') ? (
                  <div className="form-section" style={{ padding: 0 }}>
                    {/* Tabs for InventoryAdjustment */}
                    <div className="inventory-tabs">
                      <div
                        className={`inventory-tab ${activeTab === 'items' ? 'active' : ''}`}
                        onClick={() => setActiveTab('items')}
                      >
                        <FaBoxes /> Items
                      </div>
                      <div
                        className={`inventory-tab ${activeTab === 'glImpact' ? 'active' : ''}`}
                        onClick={() => setActiveTab('glImpact')}
                      >
                        <FaChartBar /> GL Impact
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="inventory-tab-content">
                      {activeTab === 'items' && (
                        <div style={{ padding: '0', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                          <InventoryItems
                            recordType={recordType}
                            mode={mode}
                            embedded={true}
                            selectedLocation={selectedLocation}
                            toLocation={toLocation}
                            selectedFormId={selectedFormId}
                          />
                        </div>
                      )}
                      {activeTab === 'glImpact' && renderGLImpactTable()}
                    </div>
                  </div>
                ) : (
                  <div className="form-section">
                    {/* Regular Items Section for new mode or InventoryTransfer */}
                    <div className="section-header">
                      <h3 className="section-title">Items</h3>
                    </div>
                    <div style={{ padding: '0', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                      <InventoryItems
                        recordType={recordType}
                        mode={mode}
                        embedded={true}
                        selectedLocation={selectedLocation}
                        toLocation={toLocation}
                        selectedFormId={selectedFormId}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="master-form-actions">
                <Button
                  type="button"
                  onClick={() => navigate(navigationPaths[recordType] || '/sales-order')}
                  className="k-button k-button-secondary"
                >
                  <FaTimes /> {mode === 'view' ? 'Close' : 'Cancel'}
                </Button>
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

export const InventoryAdjustmentForm = (props) => <InventoryForm {...props} recordType="InventoryAdjustment" />;
export const InventoryTransferForm = (props) => <InventoryForm {...props} recordType="InventoryTransfer" />;

export default InventoryForm;