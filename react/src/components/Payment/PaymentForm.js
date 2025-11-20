import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiConfig, buildUrl } from '../../config/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Field, FormElement } from '@progress/kendo-react-form';
import { Input, TextArea, NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import { FaSave, FaTimes, FaTrash, FaChartBar, FaMoneyBillWave } from 'react-icons/fa';
import { useDynamicForm } from '../../hooks/useDynamicForm';
import { processJvLines, generateJvLines } from '../../hooks/useProcessingJvLines';
import { processJournal } from '../../hooks/useJournal';
import PaymentLine from './PaymentLine';
import '../../shared/styles/DynamicFormCSS.css';

// Tab styles for Payment form
const tabStyles = `
  .payment-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid #e8eaed;
    margin-bottom: 0;
    background: transparent;
    padding: 0;
  }

  .payment-tab {
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

  .payment-tab:hover {
    background: #e8f0fe;
    color: #1a73e8;
  }

  .payment-tab.active {
    background: white;
    color: #1a73e8;
    border-bottom: 2px solid white;
    margin-bottom: -2px;
    font-weight: 700;
  }

  .payment-tab svg {
    font-size: 14px;
  }

  .payment-tab:first-child svg {
    color: #34a853;
  }

  .payment-tab:first-child.active svg {
    color: #34a853;
  }

  .payment-tab:last-child svg {
    color: #ea8600;
  }

  .payment-tab:last-child.active svg {
    color: #ea8600;
  }

  .payment-tab-content {
    background: white;
    border: 1px solid #e8eaed;
    border-top: none;
    padding: 0;
    min-height: 300px;
  }

  .transactions-section {
    padding: 24px;
    background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
    border-radius: 0;
    margin: 0;
    min-height: 300px;
  }

  .transactions-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f1f3f4;
  }

  .transactions-header h3 {
    margin: 0;
    color: #202124;
    font-size: 16px;
    font-weight: 600;
  }

  .transactions-icon {
    color: #1a73e8;
    font-size: 16px;
  }

  .transactions-table {
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

  .transactions-table th {
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

  .transactions-table th:first-child {
    border-radius: 8px 0 0 0;
  }

  .transactions-table th:last-child {
    border-radius: 0 8px 0 0;
  }

  .transactions-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f3f4;
    font-size: 13px;
    color: #202124;
    font-weight: 400;
    position: relative;
    vertical-align: middle;
  }

  .transactions-table tbody tr {
    transition: all 0.3s ease;
    background: white;
  }

  .transactions-table tbody tr:nth-child(even) {
    background: #fafbfc;
  }

  .transactions-table tbody tr:hover {
    background: linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(26,115,232,0.12);
  }

  .transactions-table tbody tr:hover td {
    color: #1a73e8;
  }

  .transactions-table tbody tr:last-child td {
    border-bottom: none;
  }

  .transactions-table tbody tr:last-child td:first-child {
    border-radius: 0 0 0 8px;
  }

  .transactions-table tbody tr:last-child td:last-child {
    border-radius: 0 0 8px 0;
  }

  .payment-amount {
    font-weight: 600;
    color: #137333;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .payment-amount::before {
    font-size: 12px;
    color: #5f6368;
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
if (typeof document !== 'undefined' && !document.getElementById('payment-form-tab-styles')) {
  const style = document.createElement('style');
  style.id = 'payment-form-tab-styles';
  style.textContent = tabStyles;
  document.head.appendChild(style);
}

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

const PaymentForm = React.memo(({ recordType, mode = 'new' }) => {
  const navigate = useNavigate();
  const { id } = useParams();

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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // PaymentLine data state
  const [paymentLineData, setPaymentLineData] = useState({
    paymentAmount: '',
    invoices: [],
    appliedTo: 0,
    unapplied: 0
  });

  const [formInitialized, setFormInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [glImpactData, setGlImpactData] = useState([]);
  const [glImpactLoading, setGlImpactLoading] = useState(false);

  // Refs for cleanup
  const notificationTimerRef = React.useRef(null);

  // Callback functions to receive PaymentLine data
  const handlePaymentLineDataChange = useCallback((data) => {
    setPaymentLineData(data);
  }, []);

  // Fetch GL Impact data for journal entry lines
  const fetchGLImpactData = useCallback(async (recordId) => {
    if (!recordId) {
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
  }, []);

  // Render GL Impact table
  const renderGLImpactTable = () => {
    if (glImpactLoading) {
      return (
        <div className="transactions-section">
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <p className="empty-state-text">Loading GL Impact data...</p>
          </div>
        </div>
      );
    }

    if (!glImpactData || glImpactData.length === 0) {
      return (
        <div className="transactions-section">
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
      <div className="transactions-section">
        <table className="transactions-table">
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
                  <span className="payment-amount">
                    {entry.debit ? entry.debit.toFixed(2) : '0.00'}
                  </span>
                </td>
                <td>
                  <span className="payment-amount">
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

  // Payment form navigation
  const navigationPaths = {
    CustomerPayment: '/customer-payment',
    VendorPayment: '/vendor-payment'
  };

  const status = {
    "Closed": "b2dae51c-12b6-4a90-adfd-4e2345026b70",
    "Open": "5e3f19d1-f615-4954-88cb-30975d52b8cd"
  }

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
      const response = await fetch(buildUrl('/record-type'), {
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

  const fetchCustomFormFields = async (formId) => {
    try {
      const response = await fetch(buildUrl(`/custom-form-field/by-form/${formId}`), {
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

  const validator = useCallback((values) => {
    const errors = {};
    if (!formConfig?.standardFields) return errors;

    formConfig.standardFields.forEach(field => {
      const value = values[field.name];

      // Skip validation for mandatory fields in edit mode if they already have values
      if (field.isMandatory && (!value || value === '') && mode !== 'edit') {
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
  }, [formConfig, mode]);

  // Store dropdown data in ref to prevent re-renders
  const dropdownDataCache = useRef({});

  // Memoize dropdown data transformation to prevent infinite loops
  const memoizedDropdownData = useMemo(() => {
    const transformedData = {};

    Object.keys(dropdownData).forEach(fieldName => {
      const options = dropdownData[fieldName] || [];

      // Create cache key based on data length and first item
      const cacheKey = `${fieldName}_${options.length}_${options[0]?.id || options[0] || ''}`;

      // Use cached data if available and unchanged
      if (dropdownDataCache.current[cacheKey]) {
        transformedData[fieldName] = dropdownDataCache.current[cacheKey];
        return;
      }

      const transformedOptions = options.map(item => {
        if (typeof item === 'string') return { text: item, value: item };
        if (item.text && item.value) return item;

        // Simplified display text logic to prevent infinite loops
        let displayText = '';

        if (item && typeof item === 'object') {
          // Priority order for display text
          if (fieldName === 'form' && item.formName) {
            displayText = item.formName;
          } else if (item.name) {
            displayText = item.name;
          } else if (item.sequenceNumber) {
            displayText = item.sequenceNumber;
          } else if (item.title) {
            displayText = item.title;
          } else if (item.description) {
            displayText = item.description;
          } else {
            // Find first string field that's not id
            const keys = Object.keys(item);
            const stringField = keys.find(key =>
              key !== 'id' &&
              typeof item[key] === 'string' &&
              item[key].trim().length > 0
            );
            displayText = stringField ? item[stringField] : String(item.id || '');
          }
        } else {
          displayText = String(item || '');
        }

        return { text: displayText, value: item.id || item };
      });

      // Cache the transformed data
      dropdownDataCache.current[cacheKey] = transformedOptions;
      transformedData[fieldName] = transformedOptions;
    });

    return transformedData;
  }, [dropdownData]);

  // Helper function to get record type ID
  const getTypeOfRecordId = useCallback(() => {
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
  }, [formConfig, recordTypes, recordType]);

  const initializeFormData = useCallback((fields) => {
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
  }, []);

  const deleteCustomFieldValues = async (recordId, typeOfRecordId) => {
    if (!recordId || !typeOfRecordId) return;

    try {
      const response = await fetch(`${apiConfig.baseURL}/custom-field-value/by-type-and-record?typeOfRecord=${typeOfRecordId}&recordId=${recordId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
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
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ ids: idsToDelete })
          });

          if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            console.warn(`Failed to bulk delete custom field values: ${deleteResponse.status} - ${errorText}`);
          } else {
            console.log(`✅ Successfully bulk deleted ${idsToDelete.length} custom field values for ${recordType} ${recordId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting custom field values:', error);
    }
  };

  const fetchCustomFieldValues = useCallback(async (recordId, typeOfRecordId, customFields = []) => {
    try {
      if (!typeOfRecordId) {
        return { customData: {}, customFieldIds: {} };
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

      const fieldTypeMap = {};
      customFields.forEach(field => {
        fieldTypeMap[field.fieldName] = field.fieldTypeName;
      });

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

            switch (fieldType) {
              case 'DatePicker':
              case 'Date':
                if (typeof convertedValue === 'string' && convertedValue.trim() !== '') {
                  const dateValue = new Date(convertedValue);
                  convertedValue = isNaN(dateValue.getTime()) ? null : dateValue;
                }
                break;

              case 'NumericTextBox':
              case 'Number':
                if (typeof convertedValue === 'string' && convertedValue.trim() !== '') {
                  const numValue = parseFloat(convertedValue);
                  convertedValue = isNaN(numValue) ? 0 : numValue;
                }
                break;

              case 'Checkbox':
              case 'Switch':
                if (typeof convertedValue === 'string') {
                  convertedValue = convertedValue.toLowerCase() === 'true' || convertedValue === '1';
                }
                break;

              case 'MultiSelect':
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
            customFieldIds[cfv.customFieldName] = cfv.id;
          }
        });
      }

      return { customData, customFieldIds };
    } catch (err) {
      return { customData: {}, customFieldIds: {} };
    }
  }, []);

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
        fetch(buildUrl(`/form/${selectedValue}`), {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        }),
        fetch(buildUrl(`/form-sequence/by-form/${selectedValue}`), {
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
      if (hasSequenceNumberField && generatedSequenceNumber) {
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

  const getDropdownProps = useCallback((fieldRenderProps) => {
    const { name: fieldName } = fieldRenderProps;
    const fieldData = memoizedDropdownData[fieldName] || [];

    const selectedOption = fieldData.find(item => item.value === fieldRenderProps.value) || null;

    const handleChange = async (e) => {
      const selectedValue = e.target.value?.value || e.target.value;
      const valueToPass = (selectedValue === '' || selectedValue === undefined) ? null : selectedValue;

      // Check location field before processing
      if (fieldName === 'location' && valueToPass) {
        // Check if customer or vendor is selected based on recordType
        if (recordType === 'CustomerPayment' && !selectedCustomer) {
          alert('Please select a Customer first before selecting a Location.');
          return; // Don't call onChange, prevent the selection
        }
        if (recordType === 'VendorPayment' && !selectedVendor) {
          alert('Please select a Vendor first before selecting a Location.');
          return; // Don't call onChange, prevent the selection
        }
      }

      // Call the original onChange if it exists
      if (fieldRenderProps.onChange) {
        fieldRenderProps.onChange({ target: { value: valueToPass } });
      }

      if (fieldName === 'form') {
        await handleFormSelection(valueToPass);
      }
      if (fieldName === 'customer') {
        setSelectedCustomer(valueToPass);
      }
      if (fieldName === 'vendor') {
        setSelectedVendor(valueToPass);
      }
      if (fieldName === 'location') {
        setSelectedLocation(valueToPass);
      }
    };

    return {
      data: fieldData,
      textField: 'text',
      valueField: 'value',
      value: selectedOption,
      onChange: handleChange,
      virtual: false,
      popupSettings: {
        appendTo: document.body,
        animate: false
      }
    };
  }, [memoizedDropdownData, handleFormSelection]);

  const getMultiSelectProps = useCallback((fieldRenderProps) => {
    const { name: fieldName } = fieldRenderProps;
    const fieldData = memoizedDropdownData[fieldName] || [];

    return {
      data: fieldData,
      textField: 'text',
      valueField: 'value'
    };
  }, [memoizedDropdownData]);

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
    const isMandatory = field.isMandatory;
    return isMandatory ? `${label} *` : label;
  };

  const getFieldValidator = useCallback((field, formRenderProps = null) => {
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

  const getCustomFieldValidator = useCallback((field) => {
    if (!field.isRequired) return undefined;
    return (value) => {
      if (!value || value === '') {
        return `${field.fieldLabel || field.fieldName} is required`;
      }
      return '';
    };
  }, []);

  const renderSingleField = useCallback((field, isCustom, isFullWidth = false, customKey = null, formRenderProps = null) => {
    const fieldName = isCustom ? `custom_${field.fieldName || field.name}` : field.name;
    const fieldId = isCustom ? field.fieldName || field.name : field.name;
    const key = customKey || `${isCustom ? 'custom' : 'standard'}-field-${field.id || fieldId}`;

    const label = isCustom
      ? `${field.fieldLabel || field.fieldName}${field.isRequired ? ' *' : ''}`
      : getFieldLabel(field, formRenderProps);

    const component = getFieldComponent(field);
    const fieldValidator = isCustom ? getCustomFieldValidator(field) : getFieldValidator(field, formRenderProps);
    const isCheckbox = field.fieldTypeName === 'Checkbox' || field.fieldTypeName === 'Switch';
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
            validator={fieldValidator}
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



  useEffect(() => {
    let isMounted = true;

    const loadFormData = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);
        setFormInitialized(false);

        setCustomFormFields([]);
        setCustomFormData({});
        setCustomFieldValueIds({});
        setOriginalCustomFormData({});
        setSelectedFormId(null);

        const recordTypesData = await fetchRecordTypes();
        if (!isMounted) return;
        setRecordTypes(recordTypesData);

        const config = await fetchFormConfiguration(recordType);

        if (!isMounted) return;
        setFormConfig(config);

        const dropdownFields = config.standardFields.filter(field =>
          field.fieldTypeName === 'DropDownList' && field.source
        );

        const typeOfRecordId = getTypeOfRecordIdDirect(config, recordTypesData, recordType);

        const dropdownPromises = dropdownFields.map(async field => {
          let data;

          if (recordType === 'ChartOfAccount' && field.name === 'parent') {
            data = await fetchDropdownData(field.source);
            data = data.filter(item => item.isParent === true);
          }
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

        // Set current date for date fields when in create/new mode
        if (mode === 'new') {
          config.standardFields.forEach(field => {
            const isDateField = field.fieldTypeName === 'DatePicker' ||
              field.fieldTypeName === 'Date' ||
              field.fieldTypeName === 'date' ||
              field.name.toLowerCase().includes('date') ||
              field.name === 'paymentDate';

            if (isDateField) {
              initialFormData[field.name] = new Date();
            }
          });
        }

        if (mode !== 'new' && id) {
          try {
            let record = {};
            switch (recordType) {
              case 'CustomerPayment': {
                const resp = await fetch(buildUrl(`/customer-payment/${id}`), {
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                });
                if (resp.ok) record = await resp.json();
                break;
              }
              case 'VendorPayment': {
                const resp = await fetch(buildUrl(`/vendor-payment/${id}`), {
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                });
                if (resp.ok) record = await resp.json();
                break;
              }
              default:
                record = {};
            }

            if (!isMounted) return;

            const recordData = record?.data || record || {};

            if (recordData && Object.keys(recordData).length > 0) {
              const mergedData = { ...initialFormData };

              // Set selected customer/vendor/location for PaymentLine component
              if (recordData.customer) {
                setSelectedCustomer(recordData.customer);
              }
              if (recordData.vendor) {
                setSelectedVendor(recordData.vendor);
              }
              if (recordData.location) {
                setSelectedLocation(recordData.location);
              }

              config.standardFields.forEach(field => {
                if (recordData[field.name] !== undefined) {
                  let fieldValue = recordData[field.name];

                  const isDateField = field.fieldTypeName === 'DatePicker' ||
                    field.fieldTypeName === 'Date' ||
                    field.fieldTypeName === 'date' ||
                    field.name.toLowerCase().includes('date') ||
                    field.name === 'soDate' ||
                    field.name === 'invoiceDate' ||
                    field.name === 'deliveryDate';

                  if (isDateField && fieldValue && typeof fieldValue === 'string') {
                    const parsedDate = new Date(fieldValue);
                    fieldValue = isNaN(parsedDate.getTime()) ? null : parsedDate;
                  }

                  mergedData[field.name] = fieldValue;
                }
              });

              const processedStandardFieldNames = config.standardFields.map(field => field.name);
              Object.keys(recordData).forEach(fieldName => {
                if (recordData[fieldName] !== undefined && !processedStandardFieldNames.includes(fieldName)) {
                  mergedData[fieldName] = recordData[fieldName];
                }
              });

              setFormData(mergedData);

              // Load GL Impact data in view and edit modes
              if ((mode === 'view' || mode === 'edit') && (recordType === 'CustomerPayment' || recordType === 'VendorPayment')) {
                try {
                  const glImpactEntries = await fetchGLImpactData(id);
                  if (!isMounted) return;
                  setGlImpactData(glImpactEntries);
                } catch (err) {
                  console.error('Error loading GL Impact data:', err);
                  setGlImpactData([]);
                }
              } else {
                // Clear GL Impact data for unsupported record types or modes
                setGlImpactData([]);
              }

              if (recordData.form) {
                try {
                  const customFields = await fetchCustomFormFields(recordData.form);
                  if (!isMounted) return;

                  setCustomFormFields(customFields);
                  setSelectedFormId(recordData.form);

                  if (customFields.length > 0) {
                    const initialCustomData = initializeFormData(customFields.map(f => ({ ...f, name: f.fieldName })));

                    const typeOfRecordId = getTypeOfRecordIdDirect(config, recordTypesData, recordType);
                    const { customData: existingCustomFieldValues, customFieldIds } = await fetchCustomFieldValues(id, typeOfRecordId, customFields);

                    if (!isMounted) return;

                    setCustomFieldValueIds(customFieldIds);

                    const existingCustomData = { ...initialCustomData, ...existingCustomFieldValues };
                    setCustomFormData(existingCustomData);

                    setOriginalCustomFormData(existingCustomData);
                  }
                } catch (err) {
                  // Silent error handling for custom fields
                }
              }
            } else {
              setFormData(initialFormData);
            }
          } catch (error) {
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
  }, [mode, id, recordType]);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }

      setCustomFormFields([]);
      setCustomFormData({});
      setCustomFieldValueIds({});
      setOriginalCustomFormData({});
      setSelectedFormId(null);
      setFormData({});
      setFormInitialized(false);
      setNotification({ show: false, message: '', type: 'success' });
    };
  }, []);


  // Helper function to update payment line items (following SalesForm.js pattern)
  const updateTransactionLineItems = async (newLineItems) => {
    // Define API endpoints for each payment type
    const paymentConfig = {
      CustomerPayment: {
        endpoint: buildUrl('/customer-payment-line'),
        getEndpoint: buildUrl(`/customer-payment-line/by-customer-payment/${id}`),
        idField: 'paymentId'
      },
      VendorPayment: {
        endpoint: buildUrl('/vendor-payment-line'),
        getEndpoint: buildUrl(`/vendor-payment-line/by-vendor-payment/${id}`),
        idField: 'paymentId'
      }
    };

    const config = paymentConfig[recordType];
    if (!config) {
      return;
    }

    try {
      // Step 1: Get existing line items from API
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

      // Step 2: Create maps for efficient lookup
      const existingItemsMap = new Map();
      existingItems.forEach(item => {
        if (item.recordID) {
          existingItemsMap.set(item.recordID, item);
        }
      });

      const newItemsMap = new Map();
      newLineItems.forEach(item => {
        if (item.id) {
          newItemsMap.set(item.id, item);
        }
      });

      // Step 3: Identify items to update, create, and delete
      const itemsToUpdate = [];
      const itemsToCreate = [];
      const itemsToDelete = [];

      // Check each new item
      newLineItems.forEach(newItem => {
        if (newItem.id && existingItemsMap.has(newItem.id)) {
          // Item exists - add to update list
          const existingItem = existingItemsMap.get(newItem.id);
          itemsToUpdate.push({ ...newItem, lineItemId: existingItem.id });
        } else {
          // Item doesn't exist - create it
          itemsToCreate.push(newItem);
        }
      });

      // Check for items to delete (exist in database but not in form)
      existingItems.forEach(existingItem => {
        if (existingItem.recordID && !newItemsMap.has(existingItem.recordID)) {
          itemsToDelete.push(existingItem);
        }
      });

      // Step 4: Build update payloads
      const updatePayloads = itemsToUpdate.map(item => {
        const linePayload = {
          id: item.lineItemId,
          paymentAmount: item.displayAmount || item.applyAmount || 0,
          recordID: item.id,
          isApplied: item.checked || false,
          refNo: item.refNo || '',
          recordType: item.type || '',
          [config.idField]: id
        };
        return cleanPayload(linePayload);
      });

      // Step 5: Build create payloads
      const createPayloads = itemsToCreate.map(item => {
        const linePayload = {
          paymentAmount: item.displayAmount || 0,
          recordID: item.id,
          isApplied: item.checked || false,
          refNo: item.refNo || '',
          recordType: item.type || '',
          [config.idField]: id
        };
        return cleanPayload(linePayload);
      });

      // Step 6: Execute bulk UPDATE
      if (updatePayloads.length > 0) {
        console.log(`📤 Bulk updating ${updatePayloads.length} payment line items...`);
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
          throw new Error(`Failed to bulk update payment line items: ${bulkUpdateResponse.status} - ${errorText}`);
        }

        console.log(`✅ Successfully bulk updated ${updatePayloads.length} payment line items`);
      }

      // Step 7: Execute bulk CREATE
      if (createPayloads.length > 0) {
        console.log(`📤 Bulk creating ${createPayloads.length} payment line items...`);
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
          throw new Error(`Failed to bulk create payment line items: ${bulkCreateResponse.status} - ${errorText}`);
        }

        console.log(`✅ Successfully bulk created ${createPayloads.length} payment line items`);
      }

      // Step 8: Execute bulk DELETE
      if (itemsToDelete.length > 0) {
        const idsToDelete = itemsToDelete.map(item => item.id).filter(id => id);

        if (idsToDelete.length > 0) {
          console.log(`📤 Bulk deleting ${idsToDelete.length} payment line items...`);
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
            throw new Error(`Failed to bulk delete payment line items: ${bulkDeleteResponse.status} - ${errorText}`);
          }

          console.log(`✅ Successfully bulk deleted ${idsToDelete.length} payment line items`);
        }
      }


    } catch (error) {
      throw error;
    }
  };

  const createTransactionLineItems = async (paymentId, paymentSeqNum, paymentAmount, paymentLineItems) => {
    try {
      // Determine the correct API endpoint based on record type
      let apiEndpoint;
      if (recordType === 'CustomerPayment') {
        apiEndpoint = buildUrl('/customer-payment-line');
      } else if (recordType === 'VendorPayment') {
        apiEndpoint = buildUrl('/vendor-payment-line');
      } else {
        throw new Error(`Unsupported record type for payment lines: ${recordType}`);
      }

      // Build all line payloads for bulk creation
      const linesToCreate = paymentLineItems.map((item) => {
        const lineItemData = {
          paymentAmount: item.displayAmount || item.applyAmount || 0,
          recordID: item.id,
          paymentSeqNum: paymentSeqNum,
          mainRecordAmount: paymentAmount,
          isApplied: item.checked || false,
          refNo: item.refNo || '',
          recordType: item.type || '',
          paymentId: paymentId
        };
        return cleanPayload(lineItemData);
      });

      // Execute bulk POST
      if (linesToCreate.length > 0) {
        console.log(`📤 Bulk creating ${linesToCreate.length} payment line items...`);
        const bulkCreatePayload = { lines: linesToCreate };

        const bulkCreateResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(bulkCreatePayload)
        });

        if (!bulkCreateResponse.ok) {
          const errorText = await bulkCreateResponse.text();
          throw new Error(`Failed to bulk create payment line items: ${bulkCreateResponse.status} - ${errorText}`);
        }

        const result = await bulkCreateResponse.json();
        console.log(`✅ Successfully bulk created ${linesToCreate.length} payment line items`);
        return result;
      }

      return [];

    } catch (error) {
      throw error;
    }
  };

  // Update record amounts after payment application
  const updateRecordAmounts = async (paymentData) => {
    try {
      const updatePromises = [];

      // Update invoices, debit memos, and vendor bills
      const checkedInvoices = paymentData.invoices?.filter(invoice => invoice.checked) || [];
      for (const invoice of checkedInvoices) {
        let apiEndpoint;

        if (invoice.type === 'Invoice') {
          apiEndpoint = buildUrl(`/invoice/${invoice.id}`);
        } else if (invoice.type === 'Debit Memo') {
          apiEndpoint = buildUrl(`/debit-memo/${invoice.id}`);
        } else if (invoice.type === 'Vendor Bill') {
          apiEndpoint = buildUrl(`/vendor-bill/${invoice.id}`);
        }

        if (!apiEndpoint) continue;

        // Fetch current record to get live amountDue (to handle concurrency)
        const getResponse = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        let currentAmountDue = 0;
        let currentAmountPaid = 0;
        if (getResponse.ok) {
          const currentRecord = await getResponse.json();
          currentAmountDue = currentRecord.amountDue || 0;
          currentAmountPaid = currentRecord.amountPaid || 0;
        }

        console.log(`${invoice.type} ${invoice.refNo}: Current Amount Due (live): ${currentAmountDue}, Payment Amount: ${invoice.displayAmount}`);

        // Calculate new amountDue using live data
        const newAmountDue = Math.max(0, currentAmountDue - (invoice.displayAmount || 0));
        const newAmountPaid = currentAmountPaid + invoice.displayAmount;

        console.log(`${invoice.type} ${invoice.refNo}: New Amount Due: ${newAmountDue}`);

        // Set status based on amountDue
        const newStatus = newAmountDue === 0 ? status["Closed"] : status["Open"];

        const updateData = { amountDue: newAmountDue, status: newStatus };

        updatePromises.push(
          fetch(apiEndpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(cleanPayload(updateData))
          })
        );
      }

      // Execute all updates
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    } catch (error) {
      throw error;
    }
  };

  // Update record amounts for edit mode - calculates differences like InventoryForm
  const updateRecordAmountsEditMode = async (paymentData, originalPaymentData) => {
    try {
      const updatePromises = [];

      // Update invoices, debit memos, and vendor bills - calculate difference from original amounts
      const checkedInvoices = paymentData.invoices?.filter(invoice => invoice.checked) || [];
      for (const invoice of checkedInvoices) {
        // Find original payment line data for this invoice
        const validTypes = ['Invoice', 'Debit Memo', 'Vendor Bill'];
        const originalInvoiceLine = originalPaymentData?.lines?.find(line =>
          line.recordID === invoice.id && validTypes.includes(line.recordType)
        );

        const originalPaymentAmount = parseFloat(originalInvoiceLine?.paymentAmount || 0);
        const newPaymentAmount = parseFloat(invoice.displayAmount || 0);
        const paymentDifference = newPaymentAmount - originalPaymentAmount;

        let apiEndpoint;

        if (invoice.type === 'Invoice') {
          apiEndpoint = buildUrl(`/invoice/${invoice.id}`);
        } else if (invoice.type === 'Debit Memo') {
          apiEndpoint = buildUrl(`/debit-memo/${invoice.id}`);
        } else if (invoice.type === 'Vendor Bill') {
          apiEndpoint = buildUrl(`/vendor-bill/${invoice.id}`);
        }

        if (!apiEndpoint) continue;

        // Fetch current record to get live amountDue (to handle concurrency)
        const getResponse = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        let currentAmountDue = 0;
        let currentAmountPaid = 0;
        if (getResponse.ok) {
          const currentRecord = await getResponse.json();
          currentAmountDue = currentRecord.amountDue || 0;
          currentAmountPaid = currentRecord.amountPaid || 0;
        }

        // Calculate new amountDue based on difference using live data
        const newAmountDue = currentAmountDue - paymentDifference;
        const newAmountPaid = currentAmountPaid + paymentDifference;

        // Show alerts for debugging
        console.log(`Edit Mode - ${invoice.type} ${invoice.refNo}: Original Payment: ${originalPaymentAmount}, New Payment: ${newPaymentAmount}, Payment Difference: ${paymentDifference}, Current Amount Due (live): ${currentAmountDue}, New Amount Due: ${newAmountDue}`);

        // Set status based on amountDue
        const newStatus = newAmountDue === 0 ? status["Closed"] : status["Open"];

        const updateData = { amountDue: newAmountDue, status: newStatus, amountPaid: newAmountPaid };

        if (paymentDifference !== 0) {
          updatePromises.push(
            fetch(apiEndpoint, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(cleanPayload(updateData))
            })
          );
        }
      }

      // Execute all updates
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    } catch (error) {
      throw error;
    }
  };

  const createMainRecord = async (standardData) => {
    try {
      standardData['amount'] = paymentLineData.paymentAmount || 0;
      standardData['unAppliedAmount'] = paymentLineData.unapplied || 0;
      standardData['appliedAmount'] = paymentLineData.appliedTo || 0;

      // Set status based on unapplied amount (similar to Credit Memo logic)
      if (parseInt(standardData.unAppliedAmount) == 0) {
        standardData.status = status["Closed"];
      } else {
        standardData.status = status["Open"];
      }

      // VALIDATION: Generate and validate JV Lines BEFORE creating record (for CustomerPayment only)
      let validatedJvLines = null;
      if (recordType === 'CustomerPayment') {
        console.log('=== Validating JV Lines before record creation ===');

        const jvValidation = await generateJvLines("", standardData.form, standardData.appliedAmount, recordType);

        if (!jvValidation.isValid) {
          alert(jvValidation.errorMessage);
          return; // Exit early without creating the record, stay on the same page
        }

        // Store validated JV lines for later processing after record is created
        validatedJvLines = jvValidation.jvLines;
        console.log('✓ JV Lines validated successfully. All accounts are configured.');
      }

      let createdRecord;
      switch (recordType) {
        case 'CustomerPayment': {
          const url = buildUrl('/customer-payment');
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(cleanPayload(standardData))
          });

          if (!resp.ok) {
            const errorText = await resp.text();
            throw new Error(`Failed to create CustomerPayment: ${resp.status} - ${errorText}`);
          }

          createdRecord = await resp.json();
          break;
        }
        case 'VendorPayment': {
          const url = buildUrl('/vendor-payment');
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(cleanPayload(standardData))
          });

          if (!resp.ok) {
            const errorText = await resp.text();
            throw new Error(`Failed to create VendorPayment: ${resp.status} - ${errorText}`);
          }

          createdRecord = await resp.json();
          break;
        }
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }

      let recordId = null;

      if (createdRecord?.id) {
        recordId = createdRecord.id;
      } else if (createdRecord?.data?.id) {
        recordId = createdRecord.data.id;
      } else if (typeof createdRecord === 'string') {
        recordId = createdRecord;
      } else {
        const possibleIdFields = Object.keys(createdRecord || {}).filter(key =>
          key.toLowerCase().includes('id')
        );

        if (possibleIdFields.length > 0) {
          recordId = createdRecord[possibleIdFields[0]];
        }
      }




      // Collect only checked invoices with all data
      const checkedInvoices = paymentLineData?.invoices?.filter(invoice => invoice.checked) || [];

      const paymentAmount = paymentLineData.paymentAmount || 0;
      const paymentSeqNum = standardData.sequenceNumber || "N/A";
      const paymentLineItems = [...checkedInvoices];
      createTransactionLineItems(recordId, paymentSeqNum, paymentAmount, paymentLineItems);

      // Generate and show payment links JSON structure
      const paymentLinksData = generatePaymentLinksJSON(recordId);
      console.log('paymentLineData:', JSON.stringify(paymentLineData));


      // Process JV Lines for accounting - use validated JV lines if available
      if (recordType === 'CustomerPayment' && validatedJvLines) {
        // Add recordId to each validated JV line
        const jvLinesWithRecordId = validatedJvLines.map(line => ({
          ...line,
          recordId: recordId,
          recordType: recordType,
          id: null // New records
        }));

        console.log('Processing validated JV lines with recordId:', recordId);
        await processJournal(jvLinesWithRecordId, 'new', recordId, recordType);
      }

      // Update record amounts (invoices/debit memos for customers, vendor bills for vendors)
      await updateRecordAmounts(paymentLineData);

      // Here at this line for payment line creation logic

      if (!recordId) {
        throw new Error(`${recordType} header created but no ID returned. Response: ${JSON.stringify(createdRecord)}`);
      }



      return recordId;
    } catch (error) {
      throw error;
    }
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
      if (String(fieldValue) !== String(originalValue)) {
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

  const generatePaymentLinksJSON = (recordId) => {
    // Return early if no applied amount
    if (paymentLineData.appliedTo <= 0) {
      return {
        payment: { paymentId: "", paymentAmount: "0.00" },
        invoicesPaid: []
      };
    }

    const paymentId = recordId;

    const paidInvoicesData = paymentLineData.invoices
      .filter(inv => inv.displayAmount > 0)
      .map(inv => {

        return {
          refNo: inv.refNo,
          date: inv.date,
          recordId: inv.id,
          type: inv.recordType,
          totalAmountPaid: inv.displayAmount.toFixed(2)
        };
      });

    const transactionData = {
      paymentAmount: parseFloat(paymentLineData.paymentAmount || 0).toFixed(2),
      invoicesPaid: paidInvoicesData,
    };

    return transactionData;
  };

  const handleSubmit = async (formValues) => {
    console.log('handleSubmit called in mode:', mode, 'with values:', formValues);

    try {
      setLoading(true);
      setError(null);

      const { standardData, customData } = separateFormData(formValues);
      if (mode === 'new') {

        const newRecordId = await createMainRecord(standardData);
        const typeOfRecordId = getTypeOfRecordId();

        // Create custom field values
        await createCustomFieldValues(customData, newRecordId, typeOfRecordId);

        showNotification(`${recordType} created successfully!`, 'success');
        navigate(navigationPaths[recordType] || '/');
      } else {
        await updateMainRecord(id, standardData);
        const typeOfRecordId = getTypeOfRecordId();

        // Update custom field values
        await updateCustomFieldValues(customData, id, typeOfRecordId);

        // Delete associated journal entry lines for edit mode
        if (recordType == "CustomerPayment") {
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

        // Update payment line items if payment line data exists
        if (paymentLineData && paymentLineData.invoices?.length > 0) {
          const checkedInvoices = paymentLineData.invoices?.filter(invoice => invoice.checked) || [];
          const paymentLineItems = [...checkedInvoices];

          if (paymentLineItems.length > 0) {
            await updateTransactionLineItems(paymentLineItems);

            // Update record amounts using edit mode specific logic
            const originalPaymentData = paymentLineData.originalData || {};
            await updateRecordAmountsEditMode(paymentLineData, originalPaymentData);
          }
        }

        // Process JV Lines for accounting in edit mode
        if (recordType == "CustomerPayment") {
          await processJvLines("", standardData.form, standardData.appliedAmount, id, recordType);
        }

        showNotification(`${recordType} updated successfully!`, 'success');
        navigate(navigationPaths[recordType] || '/');
      }

    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateMainRecord = async (recordId, standardData) => {

    try {
      console.log('paymentLineData89999999999999999:', paymentLineData);
      standardData['amount'] = paymentLineData.paymentAmount || 0;
      standardData['unAppliedAmount'] = paymentLineData.unapplied || 0;
      standardData['appliedAmount'] = paymentLineData.appliedTo || 0;

      // Set status based on unapplied amount (similar to Credit Memo logic)
      if (parseInt(standardData.unAppliedAmount) == 0) {
        standardData.status = status["Closed"];
      } else {
        standardData.status = status["Open"];
      }

      let url;
      switch (recordType) {
        case 'CustomerPayment':
          url = buildUrl(`/customer-payment/${recordId}`);
          break;
        case 'VendorPayment':
          url = buildUrl(`/vendor-payment/${recordId}`);
          break;
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }

      const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(cleanPayload(standardData))
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to update ${recordType}: ${resp.status} - ${errorText}`);
      }

      return await resp.json();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Configuration for payment line items - using new delete by payment ID endpoint
      const paymentConfig = {
        CustomerPayment: {
          deleteByPaymentEndpoint: buildUrl(`/customer-payment-line/by-customer-payment/${id}`),
          mainEndpoint: buildUrl(`/customer-payment/${id}`)
        },
        VendorPayment: {
          deleteByPaymentEndpoint: buildUrl(`/vendor-payment-line/by-vendor-payment/${id}`),
          mainEndpoint: buildUrl(`/vendor-payment/${id}`)
        }
      };

      const config = paymentConfig[recordType];
      if (!config) {
        throw new Error(`Unsupported record type: ${recordType}`);
      }

      // Step 1: Fetch all payment line items for this payment ID

      const getLineItemsResponse = await fetch(config.deleteByPaymentEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      let paymentLines = [];
      if (getLineItemsResponse.ok) {
        const responseData = await getLineItemsResponse.json();
        // Extract lines array from the response structure
        paymentLines = responseData.lines || [];
      }

      const bill = paymentLines.filter(line => line.recordType === 'Vendor Bill');

      // Step 2: Revert amountDue for related invoices, vendor bills, and debit memos
      console.log("paymentLines", paymentLines)
      if (paymentLines.length > 0) {
        const amountReversionPromises = paymentLines.map(async (line) => {
          if (!line.recordID || !line.paymentAmount || !line.recordType) {
            return; // Skip invalid lines
          }

          try {
            // Determine the correct API endpoint based on record type
            let recordEndpoint;
            let recordTypeForAPI = line.recordType;

            if (recordType === 'CustomerPayment') {
              // Customer payment can be applied to Invoice, CreditMemo, or DebitMemo
              if (recordTypeForAPI === 'Invoice') {
                recordEndpoint = buildUrl(`/invoice/${line.recordID}`);
              } else if (recordTypeForAPI === 'Debit Memo') {
                recordEndpoint = buildUrl(`/debit-memo/${line.recordID}`);
              }
            } else if (recordType === 'VendorPayment') {
              // Vendor payment can be applied to VendorBill or VendorCredit
              if (recordTypeForAPI === 'Vendor Bill') {
                recordEndpoint = buildUrl(`/vendor-bill/${line.recordID}`);
              }
            }

            if (!recordEndpoint) {
              console.warn(`Unsupported record type for amount reversion: ${recordTypeForAPI}`);
              return;
            }

            // Fetch the current record to get current amountDue
            const getRecordResponse = await fetch(recordEndpoint, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });

            if (!getRecordResponse.ok) {
              console.warn(`Failed to fetch ${recordTypeForAPI} ${line.recordID} for amount reversion`);
              return;
            }

            const recordData = await getRecordResponse.json();
            const currentAmountDue = recordData.amountDue || 0;
            const currentAmountPaid = recordData.amountPaid || 0;
            const paymentAmountToRevert = line.paymentAmount || 0;

            // Calculate new amountDue (add back the payment amount)
            const newAmountDue = currentAmountDue + paymentAmountToRevert;
            const newAmountPaid = currentAmountPaid - paymentAmountToRevert;

            // Set status based on amountDue
            const newStatus = newAmountDue === 0 ? status["Closed"] : status["Open"];

            // Update the record with the reverted amountDue and status
            const updatePayload = {
              ...recordData,
              amountDue: newAmountDue,
              status: newStatus,
              amountPaid: newAmountPaid
            };

            // Remove navigation properties that shouldn't be in update payload
            delete updatePayload.customerName;
            delete updatePayload.locationName;
            delete updatePayload.soSequenceNumber;
            delete updatePayload.dnSequenceNumber;
            delete updatePayload.formName;
            delete updatePayload.vendorName;

            const updateResponse = await fetch(recordEndpoint, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(cleanPayload(updatePayload))
            });

            if (!updateResponse.ok) {
              const errorText = await updateResponse.text();
              console.warn(`Failed to revert amountDue for ${recordTypeForAPI} ${line.recordID}: ${errorText}`);
            } else {
              console.log(`Successfully reverted amountDue for ${recordTypeForAPI} ${line.recordID}: ${currentAmountDue} + ${paymentAmountToRevert} = ${newAmountDue}`);
            }

          } catch (error) {
            console.warn(`Error reverting amountDue for ${line.recordType} ${line.recordID}:`, error);
          }
        });

        // Wait for all amount reversions to complete
        await Promise.all(amountReversionPromises);
      }

      // Step 3: Delete all payment line items using bulk DELETE
      if (paymentLines.length > 0) {
        const deleteEndpoint = recordType === 'CustomerPayment'
          ? buildUrl('/customer-payment-line')
          : buildUrl('/vendor-payment-line');

        const idsToDelete = paymentLines.map(line => line.id).filter(id => id);

        if (idsToDelete.length > 0) {
          const bulkDeletePayload = {
            ids: idsToDelete
          };

          console.log(`📤 [${recordType} Delete - Bulk Delete Lines] Sending ${idsToDelete.length} IDs:`, bulkDeletePayload);

          const bulkDeleteResponse = await fetch(deleteEndpoint, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bulkDeletePayload)
          });

          if (!bulkDeleteResponse.ok) {
            const errorText = await bulkDeleteResponse.text();
            throw new Error(`Failed to bulk delete payment lines: ${bulkDeleteResponse.status} - ${errorText}`);
          }

          console.log(`✅ Successfully bulk deleted ${idsToDelete.length} payment lines`);
        }
      }

      // Step 4: Now delete the main payment record
      const resp = await fetch(config.mainEndpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to delete ${recordType}: ${resp.status} - ${errorText}`);
      }

      // Delete associated journal entry lines
      if (recordType == "CustomerPayment") {
        try {
          console.log('existingResponse delete 11111111111111 ---- id', id);
          const existingResponse = await fetch(`${apiConfig.baseURL}/journal-entry-line/by-record-id/${id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          console.log('existingResponse delete 11111111111111', existingResponse);
          let existingItems = [];
          if (existingResponse.ok) {
            const existingData = await existingResponse.json();
            if (Array.isArray(existingData)) {
              existingItems = existingData;
            }
          }

          console.log("existingItems 22222222", existingItems)
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
            await processJournal(changes, 'delete');
          }
        } catch (error) {
          console.error('Error deleting journal entry lines:', error);
          // Don't throw - continue with the deletion flow
        }
      }

      // Delete custom field values
      const typeOfRecordId = getTypeOfRecordId();
      await deleteCustomFieldValues(id, typeOfRecordId);

      showNotification(`${recordType} deleted successfully!`, 'success');
      navigate(navigationPaths[recordType] || '/');
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };


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


  if (loading || !formConfig || !formInitialized) {
    return (
      <div className="master-form-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <div>Loading {recordType.toLowerCase()} form...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="master-form-container">
        <div className="error-message">
          <h3>Error Loading {recordType}</h3>
          <p>{error}</p>
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

      <div className="master-form-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2>
            {mode === 'new' ? `Create New ${recordType}` :
              mode === 'edit' ? `Edit ${recordType}` : `View ${recordType}`}
          </h2>
          {/* Status badge in header for edit/view mode */}
          {(mode === 'edit' || mode === 'view') && formData.status && (() => {
            // Map status IDs to display names
            const statusMap = {
              "b2dae51c-12b6-4a90-adfd-4e2345026b70": "Closed",
              "5e3f19d1-f615-4954-88cb-30975d52b8cd": "Open"
            };
            const statusName = statusMap[formData.status] || '';

            // Define status colors
            const getStatusColor = (name) => {
              switch (name.toLowerCase()) {
                case 'open': return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' };
                case 'closed': return { bg: '#F3F4F6', text: '#374151', border: '#6B7280' };
                default: return { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
              }
            };

            const colors = getStatusColor(statusName);

            return (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                {statusName}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Enhanced Total and Applied/Unapplied Display - for CustomerPayment and VendorPayment */}
      {(mode === 'edit' || mode === 'view') && (recordType === 'CustomerPayment' || recordType === 'VendorPayment') && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '20px',
          marginTop: '10px'
        }}>
          <div style={{
            display: 'flex',
            backgroundColor: '#ffffff',
            border: '2px solid #e8f4fd',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            minWidth: '420px'
          }}>
            {/* Total Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 20px',
              backgroundColor: '#f8fbff',
              borderRight: '1px solid #e8f4fd',
              flex: 1
            }}>
              <div style={{
                fontSize: '10px',
                color: '#7a8699',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>
                Amount
              </div>
              <div style={{
                fontSize: '18px',
                color: '#2c3e50',
                fontWeight: '700',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {(formData?.amount?.toFixed(2) || paymentLineData?.paymentAmount?.toFixed(2) || '0.00')}
              </div>
            </div>

            {/* Applied Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 20px',
              backgroundColor: '#f0fdf4',
              borderRight: '1px solid #e8f4fd',
              flex: 1
            }}>
              <div style={{
                fontSize: '10px',
                color: '#7a8699',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>
                Applied
              </div>
              <div style={{
                fontSize: '18px',
                color: '#16a34a',
                fontWeight: '700',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {(formData?.appliedAmount?.toFixed(2) || paymentLineData?.appliedTo?.toFixed(2) || '0.00')}
              </div>
            </div>

            {/* Unapplied Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              flex: 1
            }}>
              <div style={{
                fontSize: '10px',
                color: '#7a8699',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>
                Unapplied
              </div>
              <div style={{
                fontSize: '18px',
                color: '#ea580c',
                fontWeight: '700',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {(formData?.unAppliedAmount?.toFixed(2) || paymentLineData?.unapplied?.toFixed(2) || '0.00')}
              </div>
            </div>
          </div>
        </div>
      )}

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
                    {renderFields(formConfig?.standardFields || [], false, formRenderProps)}
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

                {/* Payment Lines and GL Impact Tabs Section */}
                <div className="form-section">
                  {/* Tabs Navigation */}
                  <div className="payment-tabs">
                    <button
                      type="button"
                      className={`payment-tab ${activeTab === 'items' ? 'active' : ''}`}
                      onClick={() => setActiveTab('items')}
                    >
                      <FaMoneyBillWave /> Apply Payment
                    </button>
                    {(mode === 'view' || mode === 'edit') && (recordType === 'CustomerPayment' || recordType === 'VendorPayment') && (
                      <button
                        type="button"
                        className={`payment-tab ${activeTab === 'glImpact' ? 'active' : ''}`}
                        onClick={() => setActiveTab('glImpact')}
                      >
                        <FaChartBar /> GL Impact
                      </button>
                    )}
                  </div>

                  {/* Tab Content */}
                  <div className="payment-tab-content">
                    {activeTab === 'items' && (
                      <div style={{ padding: '0', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                        <PaymentLine
                          recordType={recordType}
                          mode={mode}
                          embedded={true}
                          customerId={mode === 'view' ? null : selectedCustomer}
                          vendorId={mode === 'view' ? null : selectedVendor}
                          locationId={mode === 'view' ? null : selectedLocation}
                          onPaymentDataChange={handlePaymentLineDataChange}
                          isViewMode={mode === 'view'}
                          paymentId={mode === 'view' || mode === 'edit' ? id : null}
                        />
                      </div>
                    )}

                    {activeTab === 'glImpact' && (mode === 'view' || mode === 'edit') && (recordType === 'CustomerPayment' || recordType === 'VendorPayment') && (
                      renderGLImpactTable()
                    )}
                  </div>
                </div>
              </div>

              <div className="master-form-actions">
                <Button
                  type="button"
                  onClick={() => navigate(navigationPaths[recordType] || '/')}
                  className="k-button k-button-secondary"
                >
                  <FaTimes /> {mode === 'view' ? 'Close' : 'Cancel'}
                </Button>
                {mode !== 'new' && mode !== 'view' && (
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
                    disabled={loading || (mode === 'edit' ? false : !formRenderProps.allowSubmit)}
                    className="k-button k-button-primary"
                    onClick={mode === 'edit' ? (e) => {
                      e.preventDefault();
                      console.log('Edit mode save button clicked');
                      handleSubmit(formRenderProps.values || combinedFormData);
                    } : undefined}
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


export const CustomerPaymentForm = (props) => <PaymentForm {...props} recordType="CustomerPayment" />;
export const VendorPaymentForm = (props) => <PaymentForm {...props} recordType="VendorPayment" />;

export default PaymentForm;
