import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiConfig, buildUrl, apiRequest } from '../../config/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Field, FormElement, FieldArray } from '@progress/kendo-react-form';
import { Input, TextArea, NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import { FaSave, FaTimes, FaTrash, FaPlus, FaTruck, FaClipboardList, FaExchangeAlt, FaEye, FaBoxes, FaCreditCard, FaChartBar, FaPencilAlt } from 'react-icons/fa';
import { useDynamicForm } from '../../hooks/useDynamicForm';
import { useSalesOrders, useItemFulfillments, useInvoices, useCreditMemos, useDebitMemos, useStatus } from '../../hooks/useMasterData';
import { processJvLines, validateJvAccountsBeforeCreate, generateJvLines } from '../../hooks/useProcessingJvLines';
import { processJournal } from '../../hooks/useJournal';
import useInventoryDetail from '../../hooks/useInventoryDetail';
import SalesItems from './SalesItems';
import cleanPayload from '../../utils/cleanPayload';
import useSalesTransactions from './hooks/useSalesTransactions';
import { TransactionsPanel, GlImpactPanel } from '../../shared/components/TransactionsPanel';
import { injectTransactionTabStyles } from '../../shared/styles/transactionTabs';
import '../../shared/styles/DynamicFormCSS.css';

injectTransactionTabStyles({
  tabsClass: 'sales-tabs',
  tabClass: 'sales-tab',
  tabContentClass: 'sales-tab-content'
});
const MASTER_DATA_NO_FETCH = { autoFetch: false };

const INVOICE_FULFILLMENT_FIELDS = ['itemFulfillmentId', 'itemFulfillment', 'dnid', 'IFID'];
const hasMeaningfulValue = (value) => value !== undefined && value !== null && value !== '';

const getCaseInsensitiveFieldValue = (obj, fieldName) => {
  if (!obj) {
    return undefined;
  }
  if (hasMeaningfulValue(obj[fieldName])) {
    return obj[fieldName];
  }
  const lookupKey = Object.keys(obj).find(key => key.toLowerCase() === fieldName.toLowerCase());
  if (lookupKey && hasMeaningfulValue(obj[lookupKey])) {
    return obj[lookupKey];
  }
  return undefined;
};

const getItemFulfillmentIdFromObject = (obj = {}) => {
  for (const field of INVOICE_FULFILLMENT_FIELDS) {
    const value = getCaseInsensitiveFieldValue(obj, field);
    if (hasMeaningfulValue(value)) {
      return value;
    }
  }
  return null;
};

const getItemFulfillmentIdFromGetter = (valueGetter) => {
  if (!valueGetter) {
    return null;
  }
  for (const field of INVOICE_FULFILLMENT_FIELDS) {
    const variations = [
      field,
      field.toLowerCase(),
      field.toUpperCase(),
      field.charAt(0).toLowerCase() + field.slice(1)
    ];
    for (const variant of variations) {
      const value = valueGetter(variant);
      if (hasMeaningfulValue(value)) {
        return value;
      }
    }
  }
  return null;
};

const assignItemFulfillmentIdToObject = (target, value) => {
  if (!target || !hasMeaningfulValue(value)) {
    return;
  }
  INVOICE_FULFILLMENT_FIELDS.forEach((field) => {
    if (!hasMeaningfulValue(target[field])) {
      target[field] = value;
    }
  });
};

const SalesForm = React.memo(({ recordType, mode = 'new' }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { loading: dynamicLoading, error: dynamicError, fetchFormConfiguration } = useDynamicForm();

  // Transaction-specific hooks - all called unconditionally to follow Rules of Hooks
  const salesOrdersHook = useSalesOrders(MASTER_DATA_NO_FETCH);
  const itemFulfillmentsHook = useItemFulfillments(MASTER_DATA_NO_FETCH);
  const invoicesHook = useInvoices(MASTER_DATA_NO_FETCH);
  const creditMemosHook = useCreditMemos(MASTER_DATA_NO_FETCH);
  const debitMemosHook = useDebitMemos(MASTER_DATA_NO_FETCH);
  const statusHook = useStatus();

  // Inventory management hook for ItemFulfillment
  const {
    createOrUpdateInventoryDetail,
    validateInventoryAvailability,
    processItemFulfillment,
    checkInventoryDetailExists,
    setInventoryQuantity,
    updateProductAverageCost,
    getTotalQuantityAllLocations,
    bulkSetInventoryQuantity,
    bulkProcessItemFulfillment
  } = useInventoryDetail();

  // Select the appropriate hook result based on recordType
  const transactionHook = recordType === 'SalesOrder' ? salesOrdersHook :
    recordType === 'ItemFulfillment' ? itemFulfillmentsHook :
      recordType === 'Invoice' ? invoicesHook :
        recordType === 'CreditMemo' ? creditMemosHook :
          recordType === 'DebitMemo' ? debitMemosHook :
            null;

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
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [formInitialized, setFormInitialized] = useState(false);
  const [itemsTotalAmount, setItemsTotalAmount] = useState(0);

  // Store original record line items for edit mode (to preserve record values when re-adding removed items)
  const [originalRecordLineItems, setOriginalRecordLineItems] = useState([]);

  // Credit Memo Payment Line data state (similar to PaymentForm.js)
  const [creditMemoPaymentLineData, setCreditMemoPaymentLineData] = useState({
    creditAmount: '',
    invoices: [],
    appliedTo: 0,
    unapplied: 0
  });
  const [activeTab, setActiveTab] = useState('items');
  const {
    transactionsData,
    transactionsLoading,
    glImpactData,
    glImpactLoading,
    loadTransactions,
    loadGlImpact,
    resetTransactions,
    resetGlImpact
  } = useSalesTransactions(recordType);

  // Refs for cleanup
  const notificationTimerRef = React.useRef(null);

  const status = {
    "Closed": "b2dae51c-12b6-4a90-adfd-4e2345026b70",
    "Open": "5e3f19d1-f615-4954-88cb-30975d52b8cd"
  }

  // Transaction form navigation - simplified for sales orders, item fulfillments, invoices, and memos
  const navigationPaths = {
    SalesOrder: '/sales-order',
    ItemFulfillment: '/item-fulfillment',
    Invoice: '/invoice',
    CreditMemo: '/credit-memo',
    DebitMemo: '/debit-memo'
  };

  const fetchDropdownData = useCallback(async (source, signal) => {
    try {
      const response = await fetch(`${apiConfig.baseURL}${source}`, {
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
      const response = await fetch(`${apiConfig.baseURL}/record-type`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        signal
      });
      if (!response.ok) throw new Error(`Failed to fetch record types: ${response.status}`);
      const data = await response.json();
      return data || [];
    } catch (err) {
      if (err.name === 'AbortError') {
        return [];
      }
      return [];
    }
  }, []);

  

  const fetchCustomFormFields = async (formId) => {
    try {
      const response = await fetch(`${apiConfig.baseURL}/custom-form-field/by-form/${formId}`, {
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

      if (response.ok) {
        const formDetails = await response.json();
        console.log('Form details fetched successfully:', formDetails);
        return formDetails;
      } else {
        console.warn('No form details returned from API');
        return null;
      }
    } catch (error) {
      console.error('Error fetching form details:', error);
      return null;
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
      const formsResponse = await fetch(`${apiConfig.baseURL}/form/by-type-of-record/${typeOfRecordId}`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (formsResponse.ok) {
        const formsData = await formsResponse.text().then(text => text.trim() ? JSON.parse(text) : []);
        const forms = Array.isArray(formsData) ? formsData : [];
        if (forms.length > 0) {
          // Use the first available form for this record type
          const defaultForm = forms[0];

          // Fetch sequence data for this form
          const sequenceResponse = await fetch(`${apiConfig.baseURL}/form-sequence/by-form/${defaultForm.id}`, {
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
          ['DropDownList', 'MultiSelect'].includes(field.fieldTypeName) && (field.source || field.fieldSource)
        );

        // Get the typeOfRecord ID for filtering forms
        const typeOfRecordId = getTypeOfRecordIdDirect(config, recordTypesData, recordType);

        // Note: Sequence number generation is now handled when a form is selected
        // This prevents automatic generation on form load

        const dropdownPromises = dropdownFields.map(async field => {
          let data;

          if (field.name === 'form' && typeOfRecordId) {
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
            const sourceEndpoint = field.source || field.fieldSource;
            data = await fetchDropdownData(sourceEndpoint);
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

        // Add status data from the hook
        if (statusHook.data && statusHook.data.length > 0) {
          dropdownDataMap.status = statusHook.data;
        }

        setDropdownData(dropdownDataMap);

        const initialFormData = initializeFormData(config.standardFields);

        // Set current date for date fields when in create/new mode
        if (mode === 'new') {
          config.standardFields.forEach(field => {
            const isDateField = field.fieldTypeName === 'DatePicker' ||
              field.fieldTypeName === 'Date' ||
              field.fieldTypeName === 'date' ||
              field.name.toLowerCase().includes('date') ||
              field.name === 'soDate' ||
              field.name === 'invoiceDate' ||
              field.name === 'deliveryDate';

            if (isDateField) {
              initialFormData[field.name] = new Date();
            }
          });

          if (recordType === 'ItemFulfillment') {
            const salesOrderDataString = sessionStorage.getItem('salesOrderDataForFulfillment');
            if (salesOrderDataString) {
              try {
                const salesOrderData = JSON.parse(salesOrderDataString);

                if (salesOrderData.form) {
                  initialFormData.form = salesOrderData.form;
                  // Generate sequence number immediately for fulfill scenario
                  try {
                    const [formResponse, sequenceResponse] = await Promise.all([
                      fetch(`${apiConfig.baseURL}/form/${salesOrderData.form}`, {
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                      }),
                      fetch(`${apiConfig.baseURL}/form-sequence/by-form/${salesOrderData.form}`, {
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                      })
                    ]);

                    if (formResponse.ok && sequenceResponse.ok) {
                      const [formData, sequenceDataArray] = await Promise.all([
                        formResponse.text().then(text => text.trim() ? JSON.parse(text) : {}),
                        sequenceResponse.text().then(text => text.trim() ? JSON.parse(text) : [])
                      ]);

                      const sequenceData = Array.isArray(sequenceDataArray) && sequenceDataArray.length > 0
                        ? sequenceDataArray[0]
                        : { formSequenceNumber: 0 };

                      const prefix = formData.prefix || '';
                      const nextSequenceNumber = (sequenceData.formSequenceNumber || 0) + 1;
                      const generatedSequenceNumber = `${prefix}${String(nextSequenceNumber).padStart(4, '0')}`;

                      initialFormData.sequenceNumber = generatedSequenceNumber;
                    }
                  } catch (error) {
                    console.error('Error generating sequence number for fulfill:', error);
                  }

                  handleFormSelection(salesOrderData.form);
                }

                // Populate ItemFulfillment form with SalesOrder data
                if (salesOrderData.soid) {
                  initialFormData.soid = salesOrderData.soid;
                }

                if (salesOrderData.customerID) {
                  initialFormData.customerID = salesOrderData.customerID;
                }
                if (salesOrderData.locationID) {
                  initialFormData.locationID = salesOrderData.locationID;
                  setSelectedLocation(salesOrderData.locationID);
                }
                if (salesOrderData.deliveryDate) {
                  initialFormData.deliveryDate = new Date(salesOrderData.deliveryDate);
                }
                if (salesOrderData.discount) {
                  initialFormData.discount = salesOrderData.discount;
                }
                if (salesOrderData.totalAmount) {
                  initialFormData.totalAmount = salesOrderData.totalAmount;
                }

                const itemsArray = salesOrderData.items?.results || salesOrderData.items || [];
                if (itemsArray && itemsArray.length > 0) {
                  initialFormData.items = itemsArray.map(item => ({
                    ...item,
                    quantityDelivered: item.quantityDelivered || item.quantity || 0,
                    quantity: item.quantity || 0,
                    salesOrderLineId: item.salesOrderLineId || item.id,
                    remainingQty: item.remainingQty || item.quantity || 0,
                    originalOrderedQty: item.originalOrderedQty
                  }));
                }


              } catch (error) {
                console.error('Error parsing SalesOrder data for fulfillment:', error);
                sessionStorage.removeItem('salesOrderDataForFulfillment');
              }
            }
          }

          if (recordType === 'Invoice') {
            const itemFulfillmentDataString = sessionStorage.getItem('itemFulfillmentDataForBilling');
            if (itemFulfillmentDataString) {
              try {
                const itemFulfillmentData = JSON.parse(itemFulfillmentDataString);

                if (itemFulfillmentData.form) {
                  initialFormData.form = itemFulfillmentData.form;
                  // Generate sequence number immediately for bill scenario
                  try {
                    const [formResponse, sequenceResponse] = await Promise.all([
                      fetch(`${apiConfig.baseURL}/form/${itemFulfillmentData.form}`, {
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                      }),
                      fetch(`${apiConfig.baseURL}/form-sequence/by-form/${itemFulfillmentData.form}`, {
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                      })
                    ]);

                    if (formResponse.ok && sequenceResponse.ok) {
                      const [formData, sequenceDataArray] = await Promise.all([
                        formResponse.text().then(text => text.trim() ? JSON.parse(text) : {}),
                        sequenceResponse.text().then(text => text.trim() ? JSON.parse(text) : [])
                      ]);

                      const sequenceData = Array.isArray(sequenceDataArray) && sequenceDataArray.length > 0
                        ? sequenceDataArray[0]
                        : { formSequenceNumber: 0 };

                      const prefix = formData.prefix || '';
                      const nextSequenceNumber = (sequenceData.formSequenceNumber || 0) + 1;
                      const generatedSequenceNumber = `${prefix}${String(nextSequenceNumber).padStart(4, '0')}`;

                      initialFormData.sequenceNumber = generatedSequenceNumber;
                    }
                  } catch (error) {
                    console.error('Error generating sequence number for bill:', error);
                  }

                  handleFormSelection(itemFulfillmentData.form);
                }

                // Populate Invoice form with ItemFulfillment data
                const sessionItemFulfillmentId = getItemFulfillmentIdFromObject(itemFulfillmentData);
                if (sessionItemFulfillmentId) {
                  assignItemFulfillmentIdToObject(initialFormData, sessionItemFulfillmentId);
                }

                if (itemFulfillmentData.customerID) {
                  initialFormData.customerID = itemFulfillmentData.customerID;
                }
                if (itemFulfillmentData.locationID) {
                  initialFormData.locationID = itemFulfillmentData.locationID;
                  setSelectedLocation(itemFulfillmentData.locationID);
                }
                if (itemFulfillmentData.deliveryDate) {
                  initialFormData.invoiceDate = new Date(itemFulfillmentData.deliveryDate);
                }
                if (itemFulfillmentData.discount) {
                  initialFormData.discount = itemFulfillmentData.discount;
                }
                if (itemFulfillmentData.totalAmount) {
                  initialFormData.totalAmount = itemFulfillmentData.totalAmount;
                }

                // Set items data for billing
                const itemsArray = itemFulfillmentData.items?.results || itemFulfillmentData.items || [];
                if (itemsArray && itemsArray.length > 0) {
                  initialFormData.items = itemsArray.map(item => ({
                    ...item,
                    quantityInvoiced: item.quantity || 0,
                    quantityDelivered: item.quantity || 0
                  }));
                }

                // Note: sessionStorage is cleared after successful form submission to allow button enabling logic

              } catch (error) {
                console.error('Error parsing ItemFulfillment data for billing:', error);
                sessionStorage.removeItem('itemFulfillmentDataForBilling');
              }
            }
          }
        }

        if (mode !== 'new' && id) {
          // Fetch existing transaction record
          try {
            let record;

            switch (recordType) {
              case 'SalesOrder':
                if (transactionHook?.fetchSalesOrderById) {
                  record = await transactionHook.fetchSalesOrderById(id);
                }
                break;

              case 'ItemFulfillment':
                if (transactionHook?.fetchItemFulfillmentById) {
                  record = await transactionHook.fetchItemFulfillmentById(id);
                }
                break;

              case 'Invoice':
                if (transactionHook?.fetchInvoiceById) {
                  record = await transactionHook.fetchInvoiceById(id);
                }
                break;

              case 'CreditMemo':
                if (transactionHook?.fetchCreditMemoById) {
                  record = await transactionHook.fetchCreditMemoById(id);
                }
                break;

              case 'DebitMemo':
                if (transactionHook?.fetchDebitMemoById) {
                  record = await transactionHook.fetchDebitMemoById(id);
                }
                break;

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
                    field.name.toLowerCase().includes('date')

                  if (isDateField && fieldValue && typeof fieldValue === 'string') {
                    // Parse ISO date string to Date object
                    const parsedDate = new Date(fieldValue);
                    // Only use parsed date if it's valid
                    fieldValue = isNaN(parsedDate.getTime()) ? null : parsedDate;
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

              if (mergedData.locationID) {
                setSelectedLocation(mergedData.locationID);
              }

              try {
                let lineItems = [];
                let lineItemsEndpoint = '';
                let lineItemsIdField = '';

                switch (recordType) {
                  case 'SalesOrder':
                    lineItemsEndpoint = `${apiConfig.baseURL}/salesorderline/by-salesorder/${id}`;
                    lineItemsIdField = 'soid';
                    break;

                  case 'ItemFulfillment':
                    lineItemsEndpoint = `${apiConfig.baseURL}/item-fulfilment-line/by-item-fulfilment/${id}`;
                    lineItemsIdField = 'dnid';
                    break;

                  case 'Invoice':
                    lineItemsEndpoint = `${apiConfig.baseURL}/invoice-line/by-invoice/${id}`;
                    lineItemsIdField = 'inid';
                    break;

                  case 'CreditMemo':
                    lineItemsEndpoint = `${apiConfig.baseURL}/credit-memo-line/by-credit-memo/${id}`;
                    lineItemsIdField = 'cmid';
                    break;

                  case 'DebitMemo':
                    lineItemsEndpoint = `${apiConfig.baseURL}/debit-memo-line/by-debit-memo/${id}`;
                    lineItemsIdField = 'debitMemoId';
                    break;

                  default:
                }

                if (lineItemsEndpoint) {

                  const lineItemsResponse = await fetch(lineItemsEndpoint, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    }
                  });


                  if (lineItemsResponse.ok) {
                    const lineItemsData = await lineItemsResponse.json();

                    // Handle different API response formats
                    if (Array.isArray(lineItemsData)) {
                      lineItems = lineItemsData;
                    } else if (lineItemsData.results && Array.isArray(lineItemsData.results)) {
                      lineItems = lineItemsData.results;
                    } else if (lineItemsData.data && Array.isArray(lineItemsData.data)) {
                      lineItems = lineItemsData.data;
                    } else if (lineItemsData.salesOrderLines && Array.isArray(lineItemsData.salesOrderLines)) {
                      lineItems = lineItemsData.salesOrderLines;
                    } else if (lineItemsData.lines && Array.isArray(lineItemsData.lines)) {
                      lineItems = lineItemsData.lines;
                    } else {
                      // If response is an object with line items as properties, extract them
                      const possibleArrays = Object.values(lineItemsData).filter(value => Array.isArray(value));
                      if (possibleArrays.length > 0) {
                        lineItems = possibleArrays[0]; // Take the first array found
                      }
                    }


                    // Add line items to form data so SalesItems component can display them
                    if (lineItems.length > 0) {
                      // Load tax data to get tax percentages
                      let taxData = [];
                      try {
                        const taxResponse = await fetch(`${apiConfig.baseURL}/tax`, {
                          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                        });
                        if (taxResponse.ok) {
                          const taxResult = await taxResponse.json();
                          taxData = taxResult.results || taxResult.data || taxResult || [];
                          // Log the structure of the first tax record to understand the field names
                          if (taxData.length > 0) {
                          }
                        }
                      } catch (err) {
                        console.warn('Failed to load tax data for calculations:', err);
                      }

                      // Calculate amounts for each line item (since API might not have correct totals)
                      const processedLineItems = lineItems.map(item => {
                        // For Invoice: use quantityDelivered from DB
                        // For others: use quantity from DB
                        const quantity = recordType === 'Invoice'
                          ? parseFloat(item.quantityDelivered || 0)
                          : parseFloat(item.quantity || 0);
                        const rate = parseFloat(item.rate || 0);

                        // Get tax percentage from tax data based on taxID
                        let taxPercent = parseFloat(item.taxPercent || 0);
                        if (taxPercent === 0 && item.taxID && taxData.length > 0) {
                          const taxRecord = taxData.find(tax => tax.id === item.taxID);
                          if (taxRecord) {
                            // Try different possible field names for tax percentage
                            taxPercent = parseFloat(taxRecord.taxPercent || taxRecord.percentage || taxRecord.rate || 0);
                          }
                        }

                        // Calculate total amount with proper rounding at each step
                        // Gross: round to 10 decimals
                        const lineTotal = Math.round(quantity * rate * 10000000000) / 10000000000;
                        // Subtotal: round to 2 decimals
                        const subtotal = Math.round((lineTotal) * 100) / 100;
                        // Tax: round to 2 decimals
                        const taxAmount = Math.round(subtotal * taxPercent / 100 * 100) / 100;
                        // Net: round to 2 decimals
                        const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

                        return {
                          ...item,
                          // Keep the quantity fields as they are from DB - don't swap them
                          quantityDelivered: recordType === 'Invoice' ? quantity : (item.quantityDelivered || 0),
                          quantity: recordType !== 'Invoice' ? quantity : (item.quantity || 0),
                          rate,
                          taxPercent, // Use the calculated tax percentage
                          taxAmount: recordType === 'Invoice' ? taxAmount : (item.taxAmount || taxAmount),
                          taxRate: recordType === 'Invoice' ? (item.taxRate || taxAmount) : item.taxRate,
                          totalAmount,
                          amount: totalAmount // Also set amount field for compatibility
                        };
                      });

                      mergedData.items = processedLineItems;
                      setFormData({ ...mergedData });

                      // Store original line items for edit mode (to preserve values when re-adding)
                      if (mode === 'edit' || mode === 'view') {
                        setOriginalRecordLineItems(processedLineItems);
                      }
                    } else {
                    }
                  } else {
                  }
                }
              } catch (lineItemsError) {
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

              // Load transactions data for Invoice and DebitMemo in view mode
              if (mode === 'view' && ['Invoice', 'DebitMemo'].includes(recordType)) {
                loadTransactions(id);
              } else {
                resetTransactions();
              }

              // Load GL Impact data for ItemFulfillment, Invoice, DebitMemo in edit and view modes, and CreditMemo only in view mode
              if (((mode === 'edit' || mode === 'view') && (recordType === 'ItemFulfillment' || recordType === 'Invoice' || recordType === 'DebitMemo')) || (mode === 'view' && recordType === 'CreditMemo')) {
                loadGlImpact(id);
              } else {
                resetGlImpact();
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
  }, [mode, id, recordType, statusHook.data, loadTransactions, loadGlImpact, resetTransactions, resetGlImpact]);

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

      // Clear sessionStorage to prevent stale data when navigating away
      // Only clear if not in the process of normal navigation flow
      const currentPath = window.location.pathname;
      const isOnExpectedTarget =
        currentPath.includes('/item-fulfillment/new') ||
        currentPath.includes('/invoice/new');

      if (!isOnExpectedTarget) {
        sessionStorage.removeItem('salesOrderDataForFulfillment');
        sessionStorage.removeItem('itemFulfillmentDataForBilling');
      }
    };
  }, []); // Only run on mount/unmount

  // Add page visibility and beforeunload listeners to clear session on navigation/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear sessionStorage when page is refreshed or browser is closed
      sessionStorage.removeItem('salesOrderDataForFulfillment');
      sessionStorage.removeItem('itemFulfillmentDataForBilling');
    };

    const handleVisibilityChange = () => {
      // Clear sessionStorage when user navigates away (page becomes hidden)
      if (document.hidden) {
        // Small delay to allow for normal navigation flow completion
        setTimeout(() => {
          const currentPath = window.location.pathname;
          const isOnExpectedTarget =
            currentPath.includes('/item-fulfillment/new') ||
            currentPath.includes('/invoice/new');

          if (!isOnExpectedTarget) {
            sessionStorage.removeItem('salesOrderDataForFulfillment');
            sessionStorage.removeItem('itemFulfillmentDataForBilling');
          }
        }, 100);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

    // Skip validation for Credit Memo to allow form submission
    if (recordType === 'CreditMemo') {
      return errors;
    }

    // Skip validation for ItemFulfillment when it has pre-populated data from sessionStorage
    if (recordType === 'ItemFulfillment' && mode === 'new') {
      const hasSessionData = sessionStorage.getItem('salesOrderDataForFulfillment');
      if (hasSessionData) {
        return errors;
      }
    }

    // Skip validation for Invoice when it has pre-populated data from sessionStorage
    if (recordType === 'Invoice' && mode === 'new') {
      const hasSessionData = sessionStorage.getItem('itemFulfillmentDataForBilling');
      if (hasSessionData) {
        return errors;
      }
    }

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

  // Helper function to calculate totals from line items
  const calculateTotalsFromItems = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        totalQuantity: 0,
        totalTaxPercent: 0,
        totalRate: 0,
        totalTaxAmount: 0,
        totalAmount: 0
      };
    }

    let totalQuantity = 0;
    let totalTaxPercent = 0;
    let totalRate = 0;
    let totalTaxAmount = 0;
    let totalAmount = 0;
    let totalItemcount = 0;

    items.forEach((line) => {
      // Use quantityDelivered for Invoice, quantity for others
      const quantityField = recordType === 'Invoice' ? 'quantityDelivered' : 'quantity';
      const quantity = Number(line[quantityField] || 0);
      totalQuantity += quantity;

      const rate = Number(line.rate || 0);
      const taxPercent = Number(line.taxPercent || 0);
      totalTaxPercent += taxPercent;

      // Calculate with proper rounding (matching SalesItems.js)
      // Gross: round to 10 decimals
      const lineTotal = Math.round(quantity * rate * 10000000000) / 10000000000;
      totalRate += lineTotal;

      // Subtotal: round to 2 decimals for tax calculation
      const roundedSubtotal = Math.round(lineTotal * 100) / 100;
      const taxAmount = Math.round(roundedSubtotal * taxPercent / 100 * 100) / 100;
      totalTaxAmount += taxAmount;

      // Use pre-calculated totalAmount from item if available, otherwise calculate with proper rounding
      totalAmount += Number(line.totalAmount || Math.round((roundedSubtotal + taxAmount) * 100) / 100);
      totalItemcount++;
    });

    // Round all values to 2 decimal places to avoid floating-point precision issues
    return {
      totalQuantity: Math.round(totalQuantity * 100) / 100,
      totalTaxPercent: Math.round(totalTaxPercent * 100) / 100,
      totalRate: Math.round(totalRate * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalItemcount: totalItemcount

    };
  };

  // Helper function to create main record (header only)
  const createMainRecord = async (standardData, formValues) => {
    if (!transactionHook) {
      throw new Error(`No hook available for record type: ${recordType}`);
    }

    // Calculate totals directly from formValues.items
    const lineItems = formValues.items || [];
    const calculatedTotals = calculateTotalsFromItems(lineItems);

    let headerDataWithTotal
    if (recordType == "Invoice") {
      const totalTaxPercent = calculatedTotals.totalTaxPercent;
      const averageTax = Math.round((totalTaxPercent / calculatedTotals.totalItemcount) * 100) / 100;
      const discount = standardData.discount;
      const subTotal = Math.round(((calculatedTotals.totalRate - discount) * 100)) / 100;
      const calculatedTax = Math.round(subTotal * averageTax / 100 * 100) / 100;
      const NetAmount = Math.round((subTotal + calculatedTax) * 100) / 100;


      headerDataWithTotal = {
        ...standardData,
        request: "create",  // Required field for the API
        totalAmount: calculatedTotals.totalAmount,
        // Map calculated totals to header record attributes
        grossAmount: calculatedTotals.totalRate,      // Sum of all subtotals (quantity × rate)
        taxTotal: calculatedTax,    // Sum of all tax amounts
        subTotal: subTotal,         // Sum of all subtotals before tax
        netTotal: NetAmount,        // Final total including tax
        amountDue: NetAmount
      };
    }
    else {
      // Create header with actual total amount from items and detailed totals
      headerDataWithTotal = {
        ...standardData,
        request: "create",  // Required field for the API
        totalAmount: calculatedTotals.totalAmount,
        // Map calculated totals to header record attributes
        grossAmount: calculatedTotals.totalRate,      // Sum of all subtotals (quantity × rate)
        taxTotal: calculatedTotals.totalTaxAmount,    // Sum of all tax amounts
        subTotal: calculatedTotals.totalRate,         // Sum of all subtotals before tax
        netTotal: calculatedTotals.totalAmount        // Final total including tax
      };
    }

    // Set Credit Memo payment line data (similar to PaymentForm.js pattern)
    if (recordType === 'CreditMemo') {
      headerDataWithTotal['unApplied'] = creditMemoPaymentLineData.unapplied || 0;
      headerDataWithTotal['applied'] = creditMemoPaymentLineData.appliedTo || 0;

      if (parseInt(headerDataWithTotal.unApplied) == 0) {
        headerDataWithTotal.status = status["Closed"];
      } else {
        headerDataWithTotal.status = status["Open"];
      }
    } else {
      headerDataWithTotal.status = status["Open"];
    }


    try {
      let validatedJvLines = null;
      if (recordType !== 'SalesOrder') {
        const lineItems = formValues.items || [];

        let jvValidation;
        if (recordType == "Invoice") {
          jvValidation = await generateJvLines(lineItems, standardData.form, itemsTotalAmount, recordType, standardData.discount, calculatedTotals);
        } else {
          jvValidation = await generateJvLines(lineItems, standardData.form, itemsTotalAmount, recordType);
        }

        if (!jvValidation.isValid) {
          alert(jvValidation.errorMessage);
          return;
        }

        validatedJvLines = jvValidation.jvLines;
      }

      // Step 1: Create transaction header
      let createdRecord;

      switch (recordType) {
        case 'SalesOrder':
          if (!transactionHook.createSalesOrder) {
            throw new Error('createSalesOrder method not available');
          }
          createdRecord = await transactionHook.createSalesOrder(headerDataWithTotal);
          break;

        case 'ItemFulfillment':
          if (!transactionHook.createItemFulfillment) {
            throw new Error('createItemFulfillment method not available');
          }

          createdRecord = await transactionHook.createItemFulfillment(headerDataWithTotal);
          break;

        case 'Invoice':
          if (!transactionHook.createInvoice) {
            throw new Error('createInvoice method not available');
          }
          createdRecord = await transactionHook.createInvoice(headerDataWithTotal);
          break;

        case 'CreditMemo':
          if (!transactionHook.createCreditMemo) {
            throw new Error('createCreditMemo method not available');
          }
          createdRecord = await transactionHook.createCreditMemo(headerDataWithTotal);
          break;

        case 'DebitMemo':
          if (!transactionHook.createDebitMemo) {
            throw new Error('createDebitMemo method not available');
          }
          headerDataWithTotal['amountDue'] = itemsTotalAmount;
          createdRecord = await transactionHook.createDebitMemo(headerDataWithTotal);
          break;

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

      if (lineItems.length > 0) {
        await createTransactionLineItems(recordId, lineItems);
      }

      // Step 3: Create Credit Memo Payment Lines if this is a Credit Memo with applied credits
      if (recordType === 'CreditMemo' && creditMemoPaymentLineData && creditMemoPaymentLineData.invoices?.length > 0) {
        const checkedInvoices = creditMemoPaymentLineData.invoices.filter(invoice => invoice.checked) || [];
        if (checkedInvoices.length > 0) {
          await createCreditMemoPaymentLines(recordId, standardData.sequenceNumber, checkedInvoices);

          // Update applied invoice/debit memo amounts
          await updateAppliedRecordAmounts(creditMemoPaymentLineData, 'new');
        }
      }

      // Process JV Lines for accounting - use validated JV lines if available
      if (recordType !== 'SalesOrder' && validatedJvLines) {
        // Add recordId to each validated JV line
        const jvLinesWithRecordId = validatedJvLines.map(line => ({
          ...line,
          recordId: recordId,
          recordType: recordType,
          id: null // New records
        }));

        await processJournal(jvLinesWithRecordId, 'new', recordId, recordType);
      } else if (recordType === 'SalesOrder') {
      }

      // Step 4: Auto-update parent record status to "Closed" if fully fulfilled/invoiced
      await updateParentRecordStatusIfComplete(recordType, standardData);
      return recordId;
    } catch (error) {
      console.error(`Error creating ${recordType}:`, error);
      throw error;
    }
  };

  // Helper function to update parent record status to "Closed" if fully fulfilled/invoiced
  const updateParentRecordStatusIfComplete = async (recordType, standardData) => {
    try {
      if (recordType === 'ItemFulfillment') {
        // Check if SalesOrder is fully fulfilled
        const salesOrderId = standardData.soid || standardData.salesOrderId;
        if (salesOrderId) {

          const response = await fetch(`${apiConfig.baseURL}/salesorderline/unfulfilled?SOID=${salesOrderId}`, {
            method: 'GET',
            headers: apiConfig.headers
          });

          if (response.ok) {
            const unfulfilledData = await response.json();
            const unfulfilledCount = unfulfilledData.results?.length || 0;


            if (unfulfilledCount === 0) {
              const updateResponse = await fetch(`${apiConfig.baseURL}/sales-order/${salesOrderId}`, {
                method: 'PUT',
                headers: apiConfig.headers,
                body: JSON.stringify({
                  status: status["Closed"]
                })
              });

              if (!updateResponse.ok) {
                console.warn(`Failed to update SalesOrder ${salesOrderId} status:`, updateResponse.status);
              }
            }
          }
        }
      } else if (recordType === 'Invoice') {
        const itemFulfillmentId = getItemFulfillmentIdFromObject(standardData);
        if (itemFulfillmentId) {
          const response = await fetch(`${apiConfig.baseURL}/item-fulfilment-line/unfulfilled?DNID=${itemFulfillmentId}`, {
            method: 'GET',
            headers: apiConfig.headers
          });


          if (response.ok) {
            const uninvoicedData = await response.json();
            const uninvoicedCount = uninvoicedData.results?.length || 0;
            if (uninvoicedCount === 0) {
              const updateResponse = await fetch(`${apiConfig.baseURL}/item-fulfilment/${itemFulfillmentId}`, {
                method: 'PUT',
                headers: apiConfig.headers,
                body: JSON.stringify({
                  status: status["Closed"]
                })
              });

              if (!updateResponse.ok) {
                console.warn(`Failed to update ItemFulfillment ${itemFulfillmentId} status:`, updateResponse.status);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`[Status Update] Error updating parent record status:`, error);
      // Don't throw error to avoid breaking the main creation flow
    }
  };

  // Helper function to update SalesOrderLine quantities for partial fulfillments
  const updateSalesOrderLineQuantities = async (fulfillmentItems, isEdit, originalFulfillmentItems = []) => {
    if (recordType !== 'ItemFulfillment') return;

    let salesOrderId = formData.soid || formData.salesOrderId;

    // If no sales order ID in formData, try to get it from the fulfillment items
    if (!salesOrderId && fulfillmentItems.length > 0) {
      // For new fulfillments, get SOID from the fulfillment line items
      const firstItem = fulfillmentItems[0];
      if (firstItem && (firstItem.soid || firstItem.salesOrderId)) {
        salesOrderId = firstItem.soid || firstItem.salesOrderId;
      }
    }

    // If still no sales order ID, try to get it from session storage (for new fulfillments from sales orders)
    if (!salesOrderId) {
      try {
        const salesOrderDataString = sessionStorage.getItem('salesOrderDataForFulfillment');
        if (salesOrderDataString) {
          const salesOrderData = JSON.parse(salesOrderDataString);
          if (salesOrderData.soid) {
            salesOrderId = salesOrderData.soid;
          }
        }
      } catch (error) {
      }
    }

    // If still no sales order ID, try to fetch from the created fulfillment record
    if (!salesOrderId) {
      // Try using the fulfillment ID from enriched line items first
      const fulfillmentId = fulfillmentItems[0]?.fulfillmentId || id;
      if (fulfillmentId) {
        try {
          const fulfillmentResponse = await fetch(`${apiConfig.baseURL}/item-fulfilment/${fulfillmentId}`, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
          });
          if (fulfillmentResponse.ok) {
            const fulfillmentData = await fulfillmentResponse.json();
            salesOrderId = fulfillmentData.soid || fulfillmentData.salesOrderId;
            if (salesOrderId) {
            }
          }
        } catch (error) {
        }
      }
    }

    if (!salesOrderId) {
      return;
    }

    try {

      // Get current SalesOrderLine items
      const salesOrderLinesResponse = await fetch(`${apiConfig.baseURL}/salesorderline/by-salesorder/${salesOrderId}`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (!salesOrderLinesResponse.ok) {
        throw new Error('Failed to fetch sales order lines');
      }

      const salesOrderLinesData = await salesOrderLinesResponse.json();
      const salesOrderLines = Array.isArray(salesOrderLinesData) ? salesOrderLinesData :
        (salesOrderLinesData.results || Object.values(salesOrderLinesData).find(v => Array.isArray(v)) || []);

      const quantityChanges = new Map();

      // For edit mode, calculate quantity changes by matching lines by their unique ID
      // This ensures that when a line's quantity is edited, we only apply the difference
      if (isEdit && originalFulfillmentItems.length > 0) {
        // Create a map of original items by their unique ID for quick lookup
        const originalItemsById = new Map();
        originalFulfillmentItems.forEach(originalItem => {
          const uniqueId = originalItem.id || originalItem.tempId;
          if (uniqueId) {
            originalItemsById.set(uniqueId, originalItem);
          }
        });

        // Create a map of current items by their unique ID
        const currentItemsById = new Map();
        fulfillmentItems.forEach(item => {
          const uniqueId = item.id || item.tempId;
          if (uniqueId) {
            currentItemsById.set(uniqueId, item);
          }
        });

        // Process each original item
        originalItemsById.forEach((originalItem, uniqueId) => {
          const salesOrderLineId = originalItem.salesOrderLineId || originalItem.soLineId;
          const originalQuantity = parseFloat(originalItem.quantity || originalItem.quantityDelivered || 0);

          // Check if this line still exists in current items
          const currentItem = currentItemsById.get(uniqueId);

          if (currentItem) {
            // Line EXISTS in both original and current - calculate the DIFFERENCE
            const currentQuantity = parseFloat(currentItem.quantity || currentItem.quantityDelivered || 0);
            const quantityDifference = currentQuantity - originalQuantity;

            if (salesOrderLineId) {
              const currentChange = quantityChanges.get(salesOrderLineId) || 0;
              quantityChanges.set(salesOrderLineId, currentChange + quantityDifference);
            }

            // Mark this item as processed
            currentItemsById.delete(uniqueId);
          } else {
            // Line was REMOVED - subtract the original quantity
            if (salesOrderLineId && originalQuantity > 0) {
              const currentChange = quantityChanges.get(salesOrderLineId) || 0;
              quantityChanges.set(salesOrderLineId, currentChange - originalQuantity);
            } else if (originalQuantity > 0 && originalItem.itemID) {
              const itemKey = `item_${originalItem.itemID}`;
              const currentChange = quantityChanges.get(itemKey) || 0;
              quantityChanges.set(itemKey, currentChange - originalQuantity);
            }
          }
        });

        // Process remaining current items (these are NEWLY ADDED items)
        currentItemsById.forEach((item, uniqueId) => {
          const salesOrderLineId = item.salesOrderLineId || item.soLineId;
          const newQuantity = parseFloat(item.quantity || item.quantityDelivered || 0);

          if (salesOrderLineId && newQuantity > 0) {
            const currentChange = quantityChanges.get(salesOrderLineId) || 0;
            quantityChanges.set(salesOrderLineId, currentChange + newQuantity);
          } else if (newQuantity > 0 && item.itemID) {
            const itemKey = `item_${item.itemID}`;
            const currentChange = quantityChanges.get(itemKey) || 0;
            quantityChanges.set(itemKey, currentChange + newQuantity);
          }
        });
      } else {
        fulfillmentItems.forEach(item => {
          const salesOrderLineId = item.salesOrderLineId || item.soLineId;
          const newQuantity = parseFloat(item.quantity || item.quantityDelivered || 0);

          if (salesOrderLineId && newQuantity > 0) {
            const currentChange = quantityChanges.get(salesOrderLineId) || 0;
            quantityChanges.set(salesOrderLineId, currentChange + newQuantity);
          } else if (newQuantity > 0 && item.itemID) {
            const itemKey = `item_${item.itemID}`;
            const currentChange = quantityChanges.get(itemKey) || 0;
            quantityChanges.set(itemKey, currentChange + newQuantity);
          }
        });
      }

      // Build update payloads for all sales order lines
      const updatePayloads = salesOrderLines
        .filter(soLine => soLine.id) // Only process lines with IDs
        .map((soLine) => {
          const itemKey = `item_${soLine.itemID}`;

          let newQuantityFulfilled = soLine.fulFillQty || soLine.quantityFulfilled || 0;

          if (quantityChanges.has(soLine.id)) {
            const quantityChange = quantityChanges.get(soLine.id);
            newQuantityFulfilled += quantityChange;
          } else if (quantityChanges.has(itemKey)) {
            const quantityChange = quantityChanges.get(itemKey);
            newQuantityFulfilled += quantityChange;
          }

          const orderedQuantity = soLine.quantity || 0;
          newQuantityFulfilled = Math.min(Math.max(0, newQuantityFulfilled), orderedQuantity);

          // Build the update payload
          const updatePayload = {
            id: soLine.id, // Include ID for bulk update
            fulFillQty: newQuantityFulfilled
          };

          return cleanPayload(updatePayload);
        });

      // Send bulk PUT request if there are lines to update
      if (updatePayloads.length > 0) {
        const bulkUpdatePayload = {
          lines: updatePayloads
        };

        console.log(`📤 [SalesOrderLine Bulk Update] Sending ${updatePayloads.length} lines:`, bulkUpdatePayload);

        const bulkUpdateResponse = await fetch(`${apiConfig.baseURL}/salesorderline`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bulkUpdatePayload)
        });

        if (!bulkUpdateResponse.ok) {
          const errorText = await bulkUpdateResponse.text();
          console.warn(`Failed to bulk update SalesOrderLine quantities: ${bulkUpdateResponse.status} - ${errorText}`);
        } else {
          console.log(`✅ [SalesOrderLine Bulk Update] Successfully updated ${updatePayloads.length} lines`);
        }
      }

      if (salesOrderId && isEdit) {
        try {
          const statusUpdateResponse = await fetch(`${apiConfig.baseURL}/sales-order/${salesOrderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: status["Open"]
            })
          });

          if (!statusUpdateResponse.ok) {
            console.warn(`Failed to update SalesOrder ${salesOrderId} status:`, statusUpdateResponse.status);
          }
        } catch (error) {
          console.error(`Error updating SalesOrder ${salesOrderId} status:`, error);
        }
      }

    } catch (error) {
      // Don't throw - this is supplementary functionality
    }
  };

  // Helper function to update ItemFulfillmentLine quantities for partial invoicing
  const updateItemFulfillmentLineQuantities = async (invoiceItems, isEdit = false, originalInvoiceItems = []) => {
    if (recordType !== 'Invoice') return;

    let itemFulfillmentId = getItemFulfillmentIdFromObject(formData);

    // If no item fulfillment ID in formData, try to get it from the invoice items
    if (!itemFulfillmentId && invoiceItems.length > 0) {
      // For new invoices, get DNID from the invoice line items
      const firstItem = invoiceItems[0];
      if (firstItem) {
        const lineItemFulfillmentId = getItemFulfillmentIdFromObject(firstItem);
        if (lineItemFulfillmentId) {
          itemFulfillmentId = lineItemFulfillmentId;
        }
      }
    }

    // If still no item fulfillment ID, try to get it from session storage (for new invoices from item fulfillments)
    if (!itemFulfillmentId) {
      try {
        const itemFulfillmentDataString = sessionStorage.getItem('itemFulfillmentDataForBilling');
        if (itemFulfillmentDataString) {
          const itemFulfillmentData = JSON.parse(itemFulfillmentDataString);
          const storedId = getItemFulfillmentIdFromObject(itemFulfillmentData);
          if (storedId) {
            itemFulfillmentId = storedId;
          }
        }
      } catch (error) {
        console.error('Error parsing ItemFulfillment data from session storage:', error);
      }
    }

    if (!itemFulfillmentId) {
      console.warn('No ItemFulfillment ID found for updating quantities');
      return;
    }

    try {
      // Get current ItemFulfillmentLine records
      const response = await fetch(`${apiConfig.baseURL}/item-fulfilment-line/by-item-fulfilment/${itemFulfillmentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ItemFulfillmentLine records: ${response.status}`);
      }

      const responseData = await response.json();
      const itemFulfillmentLines = responseData.lines || [];

      if (itemFulfillmentLines.length === 0) {
        console.warn('No ItemFulfillmentLine records found');
        return;
      }

      const quantityChanges = new Map();

      if (isEdit && originalInvoiceItems.length > 0) {
        const originalItemsById = new Map();
        originalInvoiceItems.forEach(originalItem => {
          const uniqueId = originalItem.id || originalItem.tempId;
          if (uniqueId) {
            originalItemsById.set(uniqueId, originalItem);
          }
        });

        const currentItemsById = new Map();
        invoiceItems.forEach(item => {
          const uniqueId = item.id || item.tempId;
          if (uniqueId) {
            currentItemsById.set(uniqueId, item);
          }
        });

        originalItemsById.forEach((originalItem, uniqueId) => {
          const itemFulfillmentLineId = originalItem.itemFulfillmentLineId || originalItem.ifLineId || originalItem.dnid;
          const originalQuantity = parseFloat(originalItem.quantityDelivered || originalItem.quantity || 0);

          const currentItem = currentItemsById.get(uniqueId);

          if (currentItem) {
            const currentQuantity = parseFloat(currentItem.quantityDelivered || currentItem.quantity || 0);
            const quantityDifference = currentQuantity - originalQuantity;

            if (itemFulfillmentLineId) {
              const currentChange = quantityChanges.get(itemFulfillmentLineId) || 0;
              quantityChanges.set(itemFulfillmentLineId, currentChange + quantityDifference);
            }

            currentItemsById.delete(uniqueId);
          } else {
            if (itemFulfillmentLineId && originalQuantity > 0) {
              const currentChange = quantityChanges.get(itemFulfillmentLineId) || 0;
              quantityChanges.set(itemFulfillmentLineId, currentChange - originalQuantity);
            } else if (originalQuantity > 0 && originalItem.itemID) {
              const itemKey = `item_${originalItem.itemID}`;
              const currentChange = quantityChanges.get(itemKey) || 0;
              quantityChanges.set(itemKey, currentChange - originalQuantity);
            } else {
              console.warn(`⚠️ [Qty Change] SKIPPED REMOVED line (id: ${uniqueId}): No itemFulfillmentLineId and no itemID/quantity. Data:`, originalItem);
            }
          }
        });

        currentItemsById.forEach((item, uniqueId) => {
          const itemFulfillmentLineId = item.itemFulfillmentLineId || item.ifLineId || item.dnid;
          const newQuantity = parseFloat(item.quantityDelivered || item.quantity || 0);

          if (itemFulfillmentLineId && newQuantity > 0) {
            const currentChange = quantityChanges.get(itemFulfillmentLineId) || 0;
            quantityChanges.set(itemFulfillmentLineId, currentChange + newQuantity);
          } else if (newQuantity > 0 && item.itemID) {
            const itemKey = `item_${item.itemID}`;
            const currentChange = quantityChanges.get(itemKey) || 0;
            quantityChanges.set(itemKey, currentChange + newQuantity);
          }
        });
      } else {
        invoiceItems.forEach(item => {
          const itemFulfillmentLineId = item.itemFulfillmentLineId || item.ifLineId || item.dnid;
          const newQuantity = parseFloat(item.quantityDelivered || item.quantity || 0);

          if (itemFulfillmentLineId) {
            const currentChange = quantityChanges.get(itemFulfillmentLineId) || 0;
            quantityChanges.set(itemFulfillmentLineId, currentChange + newQuantity);
          }
        });
      }

      // Build update payloads for all item fulfillment lines
      const updatePayloads = itemFulfillmentLines
        .filter(ifLine => ifLine.id) // Only process lines with IDs
        .map((ifLine) => {
          // For old records, also check by itemID as fallback
          const itemKey = `item_${ifLine.itemID}`;

          // Use the correct field name for current invoiced quantity
          let newInvoicedQty = ifLine.invoicedQty || 0;
          const currentDbInvoicedQty = newInvoicedQty; // Store for logging

          console.log(`[invoicedQty Update] Processing IF Line ${ifLine.id}, itemID: ${ifLine.itemID}`);
          console.log(`[invoicedQty Update] - Current DB invoicedQty: ${currentDbInvoicedQty}`);

          // Apply the quantity change (delta) for this item fulfillment line
          // The change map already has the net change (original subtracted, new added)
          if (quantityChanges.has(ifLine.id)) {
            const quantityChange = quantityChanges.get(ifLine.id);
            console.log(`[invoicedQty Update] - Quantity change for itemFulfillmentLineId ${ifLine.id}: ${quantityChange > 0 ? '+' : ''}${quantityChange}`);
            newInvoicedQty += quantityChange;
            console.log(`[invoicedQty Update] - New invoicedQty: ${currentDbInvoicedQty} + ${quantityChange} = ${newInvoicedQty}`);
          } else if (quantityChanges.has(itemKey)) {
            // Fallback for old records: match by itemID
            const quantityChange = quantityChanges.get(itemKey);
            console.log(`[invoicedQty Update] - Quantity change for itemKey ${itemKey}: ${quantityChange > 0 ? '+' : ''}${quantityChange}`);
            newInvoicedQty += quantityChange;
            console.log(`[invoicedQty Update] - New invoicedQty: ${currentDbInvoicedQty} + ${quantityChange} = ${newInvoicedQty}`);
          } else {
            console.log(`[invoicedQty Update] - No quantity change for this IF line`);
          }

          // Ensure invoiced quantity doesn't exceed delivered quantity
          const deliveredQuantity = ifLine.quantity || 0;
          newInvoicedQty = Math.min(Math.max(0, newInvoicedQty), deliveredQuantity);
          console.log(`[invoicedQty Update] - Final invoicedQty (clamped): ${newInvoicedQty}`);

          // Build the update payload
          const updatePayload = {
            id: ifLine.id, // Include ID for bulk update
            invoicedQty: newInvoicedQty
          };

          return cleanPayload(updatePayload);
        });

      // Send bulk PUT request if there are lines to update
      if (updatePayloads.length > 0) {
        const bulkUpdatePayload = {
          lines: updatePayloads
        };

        console.log(`📤 [ItemFulfillmentLine Bulk Update] Sending ${updatePayloads.length} lines:`, bulkUpdatePayload);

        const bulkUpdateResponse = await fetch(`${apiConfig.baseURL}/item-fulfilment-line`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bulkUpdatePayload)
        });

        if (!bulkUpdateResponse.ok) {
          const errorText = await bulkUpdateResponse.text();
          console.warn(`Failed to bulk update ItemFulfillmentLine quantities: ${bulkUpdateResponse.status} - ${errorText}`);
        } else {
          console.log(`✅ [ItemFulfillmentLine Bulk Update] Successfully updated ${updatePayloads.length} lines`);
        }
      }

      // Update ItemFulfillment status to "Open" if in edit mode
      if (itemFulfillmentId && isEdit) {
        try {
          console.log(`[Status Update] Setting ItemFulfillment ${itemFulfillmentId} status to Open`);
          const statusUpdateResponse = await fetch(`${apiConfig.baseURL}/item-fulfilment/${itemFulfillmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: status["Open"]
            })
          });

          if (statusUpdateResponse.ok) {
            console.log(`✅ ItemFulfillment ${itemFulfillmentId} status updated to Open`);
          } else {
            console.warn(`Failed to update ItemFulfillment ${itemFulfillmentId} status:`, statusUpdateResponse.status);
          }
        } catch (error) {
          console.error(`Error updating ItemFulfillment ${itemFulfillmentId} status:`, error);
        }
      }

    } catch (error) {
      console.error('Error updating ItemFulfillmentLine quantities:', error);
      // Don't throw - this is supplementary functionality
    }
  };

  // Helper function to update transaction line items (exact FormCreator.js pattern)
  const updateTransactionLineItemsSimple = async (newLineItems) => {


    // Define API endpoints for each transaction type
    const transactionConfig = {
      SalesOrder: {
        endpoint: `${apiConfig.baseURL}/salesorderline`,
        getEndpoint: `${apiConfig.baseURL}/salesorderline/by-salesorder/${id}`,
        idField: 'soid',
        quantityField: 'quantity'
      },
      ItemFulfillment: {
        endpoint: `${apiConfig.baseURL}/item-fulfilment-line`,
        getEndpoint: `${apiConfig.baseURL}/item-fulfilment-line/by-item-fulfilment/${id}`,
        idField: 'dnid',
        quantityField: 'quantity'
      },
      Invoice: {
        endpoint: `${apiConfig.baseURL}/invoice-line`,
        getEndpoint: `${apiConfig.baseURL}/invoice-line/by-invoice/${id}`,
        idField: 'inid',
        quantityField: 'quantityDelivered'
      },
      CreditMemo: {
        endpoint: `${apiConfig.baseURL}/credit-memo-line`,
        getEndpoint: `${apiConfig.baseURL}/credit-memo-line/by-credit-memo/${id}`,
        idField: 'cmid',
        quantityField: 'quantity'
      },
      DebitMemo: {
        endpoint: `${apiConfig.baseURL}/debit-memo-line`,
        getEndpoint: `${apiConfig.baseURL}/debit-memo-line/by-debit-memo/${id}`,
        idField: 'debitMemoId',
        quantityField: 'quantity'
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
      newLineItems.forEach((newItem, index) => {


        // REMOVED: Auto-populated item handling in edit mode

        if (newItem.id && existingItemsMap.has(newItem.id)) {
          // Item exists in database - update it with current form values
          itemsToUpdate.push(newItem);
        } else if (newItem.id) {
          // Item has ID but not found in database - this shouldn't happen in normal edit flow
          const itemToCreate = { ...newItem };
          delete itemToCreate.id; // Remove ID so API creates new one
          itemsToCreate.push(itemToCreate);
        } else {
          // Regular new item without ID - create it
          itemsToCreate.push(newItem);
        }
      });

      // Check for items to delete (exist in database but not in form)
      existingItems.forEach(existingItem => {
        if (existingItem.id && !newItemsMap.has(existingItem.id)) {
          itemsToDelete.push(existingItem);
        }
      });


      console.log("itemsToUpdate", itemsToUpdate)

      // Step 4: Build update payloads for bulk PUT
      const updatePayloads = itemsToUpdate.map(item => {
        // CRITICAL: For Invoice, use quantityDelivered field ONLY (not quantity)
        const quantityValue = recordType === 'Invoice'
          ? parseFloat(item.quantityDelivered || 0)
          : parseFloat(item.quantity || item.quantityDelivered || 0);

        const linePayload = {
          id: item.id, // Include ID for bulk update
          [config.idField]: id,
          itemID: item.itemID || item.itemId,
          [config.quantityField]: quantityValue,
          rate: parseFloat(item.rate || 0),
          discount: parseFloat(item.discount || 0),
          taxID: item.taxID || item.taxId,
          taxPercent: parseFloat(item.taxPercent || 0),
          taxAmount: recordType === 'Invoice' ? parseFloat(item.taxRate || 0) : parseFloat(item.taxAmount || 0),
          taxRate: recordType === 'Invoice' ? parseFloat(item.taxRate || 0) : parseFloat(item.taxAmount || 0),
          amount: parseFloat(item.amount || item.totalAmount || 0)
        };

        // Add parent line ID fields for proper duplicate item tracking
        if (recordType === 'ItemFulfillment' && item.salesOrderLineId) {
          linePayload.salesOrderLineId = item.salesOrderLineId;
        }
        if (recordType === 'Invoice') {
          // CRITICAL: Extract itemFulfillmentLineId from various possible field names
          const itemFulfillmentLineId = item.itemFulfillmentLineId ||
            item.ifLineId ||
            item.dnid;

          if (itemFulfillmentLineId) {
            linePayload.itemFulfillmentLineId = itemFulfillmentLineId;
            console.log(`✅ [Invoice Update] Setting itemFulfillmentLineId: ${itemFulfillmentLineId} for item ${item.itemID}`);
          } else {
            console.warn(`⚠️ [Invoice Update] No itemFulfillmentLineId found for item ${item.id}! Item data:`, {
              itemID: item.itemID,
              itemFulfillmentLineId: item.itemFulfillmentLineId,
              ifLineId: item.ifLineId,
              dnid: item.dnid
            });
          }
        }

        return cleanPayload(linePayload);
      });

      // Step 5: Build create payloads for bulk POST
      const createPayloads = itemsToCreate.map(item => {
        // CRITICAL: For Invoice, use quantityDelivered field ONLY (not quantity)
        const quantityValue = recordType === 'Invoice'
          ? parseFloat(item.quantityDelivered || 0)
          : parseFloat(item.quantity || item.quantityDelivered || 0);

        const linePayload = {
          [config.idField]: id,
          itemID: item.itemID || item.itemId,
          [config.quantityField]: quantityValue,
          rate: parseFloat(item.rate || 0),
          discount: parseFloat(item.discount || 0),
          taxID: item.taxID || item.taxId,
          taxPercent: parseFloat(item.taxPercent || 0),
          taxAmount: recordType === 'Invoice' ? parseFloat(item.taxRate || 0) : parseFloat(item.taxAmount || 0),
          taxRate: recordType === 'Invoice' ? parseFloat(item.taxRate || 0) : parseFloat(item.taxAmount || 0),
          amount: parseFloat(item.amount || item.totalAmount || 0)
        };

        // Add parent line ID fields for proper duplicate item tracking
        if (recordType === 'ItemFulfillment' && item.salesOrderLineId) {
          linePayload.salesOrderLineId = item.salesOrderLineId;
        }
        if (recordType === 'Invoice') {
          // CRITICAL: Extract itemFulfillmentLineId from various possible field names
          const itemFulfillmentLineId = item.itemFulfillmentLineId ||
            item.ifLineId ||
            item.dnid;

          if (itemFulfillmentLineId) {
            linePayload.itemFulfillmentLineId = itemFulfillmentLineId;
            console.log(`✅ [Invoice Create in Edit] Setting itemFulfillmentLineId: ${itemFulfillmentLineId} for item ${item.itemID}`);
          } else {
            console.warn(`⚠️ [Invoice Create in Edit] No itemFulfillmentLineId found! Item data:`, {
              itemID: item.itemID,
              itemFulfillmentLineId: item.itemFulfillmentLineId,
              ifLineId: item.ifLineId,
              dnid: item.dnid
            });
          }
        }

        return cleanPayload(linePayload);
      });

      // Step 6: Execute bulk UPDATE if there are items to update
      if (updatePayloads.length > 0) {
        const bulkUpdatePayload = {
          lines: updatePayloads
        };

        console.log(`📤 [${recordType} Bulk Update] Sending ${updatePayloads.length} lines:`, bulkUpdatePayload);

        const bulkUpdateResponse = await fetch(config.endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bulkUpdatePayload)
        });

        if (!bulkUpdateResponse.ok) {
          const errorData = await bulkUpdateResponse.text();
          throw new Error(`Failed to bulk update line items: ${bulkUpdateResponse.status} - ${errorData}`);
        }

        console.log(`✅ [${recordType} Bulk Update] Successfully updated ${updatePayloads.length} lines`);
      }

      // Step 7: Execute bulk CREATE if there are items to create
      if (createPayloads.length > 0) {
        const bulkCreatePayload = {
          lines: createPayloads
        };

        console.log(`📤 [${recordType} Bulk Create] Sending ${createPayloads.length} lines:`, bulkCreatePayload);

        const bulkCreateResponse = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bulkCreatePayload)
        });

        if (!bulkCreateResponse.ok) {
          const errorData = await bulkCreateResponse.text();
          throw new Error(`Failed to bulk create line items: ${bulkCreateResponse.status} - ${errorData}`);
        }

        console.log(`✅ [${recordType} Bulk Create] Successfully created ${createPayloads.length} lines`);
      }

      // Step 8: Execute bulk DELETE if there are items to delete
      if (itemsToDelete.length > 0) {
        const idsToDelete = itemsToDelete.map(item => item.id).filter(id => id);

        if (idsToDelete.length > 0) {
          const bulkDeletePayload = {
            ids: idsToDelete
          };

          console.log(`📤 [${recordType} Bulk Delete] Sending ${idsToDelete.length} IDs:`, bulkDeletePayload);

          const bulkDeleteResponse = await fetch(config.endpoint, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bulkDeletePayload)
          });

          if (!bulkDeleteResponse.ok) {
            const errorData = await bulkDeleteResponse.text();
            throw new Error(`Failed to bulk delete line items: ${bulkDeleteResponse.status} - ${errorData}`);
          }

          console.log(`✅ [${recordType} Bulk Delete] Successfully deleted ${idsToDelete.length} lines`);
        }
      }


      // For ItemFulfillment: Update SalesOrderLine quantities after line item operations
      if (recordType === 'ItemFulfillment') {
        // Get original fulfillment items for edit mode
        let originalItems = [];
        if (mode === 'edit' && existingItems.length > 0) {
          originalItems = existingItems;
        }

        await updateSalesOrderLineQuantities(newLineItems, mode === 'edit', originalItems);

        // Update inventory in edit mode
        if (mode === 'edit' && selectedLocation) {
          const locationId = selectedLocation?.value || selectedLocation;

          // Step 1: Reverse inventory for deleted items (add quantity back)
          for (const deletedItem of itemsToDelete) {
            try {
              const itemId = deletedItem.itemID || deletedItem.itemId;
              const quantity = parseFloat(deletedItem.quantity || 0);

              if (itemId && locationId && quantity !== 0) {
                console.log(`Reversing inventory for deleted item ${itemId}: +${quantity}`);

                // Reverse inventory - just add back the quantity
                const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
                if (inventoryDetail) {
                  const currentQty = Number(inventoryDetail.quantityAvailable || 0);
                  const newQty = currentQty + quantity; // Add back the quantity

                  await setInventoryQuantity({
                    itemId: itemId,
                    locationId: locationId,
                    quantity: newQty
                  });

                  console.log(`✅ Inventory reversed for deleted item ${itemId}: ${currentQty} → ${newQty}`);
                }
              }
            } catch (inventoryError) {
              console.error(`❌ Failed to reverse inventory for deleted item ${deletedItem.itemID}:`, inventoryError.message);
            }
          }

          // Step 2: Update inventory for modified items (BULK)
          if (itemsToUpdate.length > 0) {
            try {
              console.log(`🔄 Bulk updating inventory for ${itemsToUpdate.length} modified items`);

              // Collect reversals and new fulfillments
              const inventoryReversals = [];
              const newFulfillments = [];
              const itemsToCheckZeroQty = [];

              for (const updatedItem of itemsToUpdate) {
                const itemId = updatedItem.itemID || updatedItem.itemId;
                const newQuantity = parseFloat(updatedItem.quantity || 0);

                // Find the original item to get the original quantity
                const originalItem = existingItems.find(item => item.id === updatedItem.id);
                const originalQuantity = parseFloat(originalItem?.quantity || 0);
                const quantityDifference = newQuantity - originalQuantity;

                console.log(`DEBUG: Inventory calculation for item ${itemId}:`);
                console.log(`DEBUG: - originalQuantity: ${originalQuantity}`);
                console.log(`DEBUG: - newQuantity: ${newQuantity}`);
                console.log(`DEBUG: - quantityDifference: ${quantityDifference}`);

                if (itemId && locationId && quantityDifference !== 0) {
                  // First reverse the original inventory
                  if (originalQuantity > 0) {
                    const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
                    if (inventoryDetail) {
                      const currentQty = Number(inventoryDetail.quantityAvailable || 0);
                      const reversedQty = currentQty + originalQuantity; // Add back original quantity

                      inventoryReversals.push({
                        itemId: itemId,
                        locationId: locationId,
                        quantity: reversedQty
                      });

                      console.log(`Prepared reversal for item ${itemId}: ${currentQty} → ${reversedQty}`);
                    }
                  }

                  // Then prepare the new fulfillment
                  if (newQuantity > 0) {
                    newFulfillments.push({
                      itemId: itemId,
                      locationId: locationId,
                      fulfillmentQty: newQuantity,
                      mode: 'create'
                    });
                    itemsToCheckZeroQty.push(itemId);
                  }
                }
              }

              // Execute bulk operations
              if (inventoryReversals.length > 0) {
                await bulkSetInventoryQuantity(inventoryReversals);
                console.log(`✅ Bulk reversed inventory for ${inventoryReversals.length} updated items`);
              }

              if (newFulfillments.length > 0) {
                const results = await bulkProcessItemFulfillment(newFulfillments);
                console.log(`✅ Bulk processed fulfillments for ${newFulfillments.length} updated items`);

                // Check if any items have 0 total quantity and update average cost
                for (const itemId of itemsToCheckZeroQty) {
                  const totalQtyAllLocations = await getTotalQuantityAllLocations(itemId);
                  if (totalQtyAllLocations === 0) {
                    console.log(`📦 Total inventory quantity across all locations is 0 for item ${itemId}, setting average cost to 0`);
                    await updateProductAverageCost(itemId, 0);
                  }
                }
              }
            } catch (inventoryError) {
              console.error(`❌ Failed to bulk update inventory for modified items:`, inventoryError.message);
            }
          }

          // Step 3: Process newly created items (BULK - subtract from inventory)
          if (itemsToCreate.length > 0) {
            try {
              console.log(`🔄 Bulk processing ${itemsToCreate.length} newly created items`);

              // Collect all new fulfillments
              const newFulfillments = [];
              const itemsToCheckZeroQty = [];

              for (const createdItem of itemsToCreate) {
                const itemId = createdItem.itemID || createdItem.itemId;
                const quantity = parseFloat(createdItem.quantity || 0);

                if (itemId && locationId && quantity !== 0) {
                  newFulfillments.push({
                    itemId: itemId,
                    locationId: locationId,
                    fulfillmentQty: quantity,
                    mode: 'create'
                  });
                  itemsToCheckZeroQty.push(itemId);
                }
              }

              // Execute bulk operation
              if (newFulfillments.length > 0) {
                const results = await bulkProcessItemFulfillment(newFulfillments);
                console.log(`✅ Bulk processed fulfillments for ${newFulfillments.length} newly created items`);

                // Check if any items have 0 total quantity and update average cost
                for (const itemId of itemsToCheckZeroQty) {
                  const totalQtyAllLocations = await getTotalQuantityAllLocations(itemId);
                  if (totalQtyAllLocations === 0) {
                    console.log(`📦 Total inventory quantity across all locations is 0 for item ${itemId}, setting average cost to 0`);
                    await updateProductAverageCost(itemId, 0);
                  }
                }
              }
            } catch (inventoryError) {
              console.error(`❌ Failed to bulk process inventory for newly created items:`, inventoryError.message);
            }
          }
        }
      }

      // For Invoice: Update ItemFulfillmentLine quantities for partial invoicing
      if (recordType === 'Invoice') {
        let originalItems = [];
        if (mode === 'edit') {
          // Get original items for edit mode to reverse quantities
          originalItems = existingItems;
        }

        await updateItemFulfillmentLineQuantities(newLineItems, mode === 'edit', originalItems);

        // Update inventory in edit mode ONLY if formType is Basic
        if (mode === 'edit' && selectedLocation) {
          const BASIC_FORM_TYPE_ID = '3ddc355d-d7e9-4ae3-bdb5-386012fd9a6f';
          const formIdValue = newLineItems[0]?.form?.value || newLineItems[0]?.form;

          if (formIdValue) {
            try {
              // Fetch form details to check formType
              const formDetails = await fetchFormDetails(formIdValue);

              if (formDetails && formDetails.formType === BASIC_FORM_TYPE_ID) {
                const locationId = selectedLocation?.value || selectedLocation;

                // Step 1: Reverse inventory for deleted items (add quantity back)
                for (const deletedItem of itemsToDelete) {
                  try {
                    const itemId = deletedItem.itemID || deletedItem.itemId;
                    const quantity = parseFloat(deletedItem.quantityDelivered || deletedItem.quantity || 0);

                    if (itemId && locationId && quantity !== 0) {
                      console.log(`Reversing inventory for deleted Invoice item ${itemId}: +${quantity} (Basic form)`);

                      // Reverse inventory - just add back the quantity
                      const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
                      if (inventoryDetail) {
                        const currentQty = Number(inventoryDetail.quantityAvailable || 0);
                        const newQty = currentQty + quantity; // Add back the quantity

                        await setInventoryQuantity({
                          itemId: itemId,
                          locationId: locationId,
                          quantity: newQty
                        });

                        console.log(`✅ Inventory reversed for deleted Invoice item ${itemId}: ${currentQty} → ${newQty} (Basic form)`);
                      }
                    }
                  } catch (inventoryError) {
                    console.error(`❌ Failed to reverse inventory for deleted Invoice item ${deletedItem.itemID}:`, inventoryError.message);
                  }
                }

                // Step 2: Update inventory for modified items (BULK)
                if (itemsToUpdate.length > 0) {
                  try {
                    console.log(`🔄 Bulk updating inventory for ${itemsToUpdate.length} modified Invoice items (Basic form)`);

                    // Collect reversals and new fulfillments
                    const inventoryReversals = [];
                    const newFulfillments = [];
                    const itemsToCheckZeroQty = [];

                    for (const updatedItem of itemsToUpdate) {
                      const itemId = updatedItem.itemID || updatedItem.itemId;
                      const newQuantity = parseFloat(updatedItem.quantityDelivered || updatedItem.quantity || 0);

                      // Find the original item to get the original quantity
                      const originalItem = existingItems.find(item => item.id === updatedItem.id);
                      const originalQuantity = parseFloat(originalItem?.quantityDelivered || originalItem?.quantity || 0);
                      const quantityDifference = newQuantity - originalQuantity;

                      console.log(`DEBUG: Invoice inventory calculation for item ${itemId}:`);
                      console.log(`DEBUG: - originalQuantity: ${originalQuantity}`);
                      console.log(`DEBUG: - newQuantity: ${newQuantity}`);
                      console.log(`DEBUG: - quantityDifference: ${quantityDifference}`);

                      if (itemId && locationId && quantityDifference !== 0) {
                        // First reverse the original inventory
                        if (originalQuantity > 0) {
                          const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
                          if (inventoryDetail) {
                            const currentQty = Number(inventoryDetail.quantityAvailable || 0);
                            const reversedQty = currentQty + originalQuantity; // Add back original quantity

                            inventoryReversals.push({
                              itemId: itemId,
                              locationId: locationId,
                              quantity: reversedQty
                            });

                            console.log(`Prepared reversal for Invoice item ${itemId}: ${currentQty} → ${reversedQty} (Basic form)`);
                          }
                        }

                        // Then prepare the new fulfillment
                        if (newQuantity > 0) {
                          newFulfillments.push({
                            itemId: itemId,
                            locationId: locationId,
                            fulfillmentQty: newQuantity,
                            mode: 'create'
                          });
                          itemsToCheckZeroQty.push(itemId);
                        }
                      }
                    }

                    // Execute bulk operations
                    if (inventoryReversals.length > 0) {
                      await bulkSetInventoryQuantity(inventoryReversals);
                      console.log(`✅ Bulk reversed inventory for ${inventoryReversals.length} updated Invoice items (Basic form)`);
                    }

                    if (newFulfillments.length > 0) {
                      const results = await bulkProcessItemFulfillment(newFulfillments);
                      console.log(`✅ Bulk processed fulfillments for ${newFulfillments.length} updated Invoice items (Basic form)`);

                      // Check if any items have 0 total quantity and update average cost
                      for (const itemId of itemsToCheckZeroQty) {
                        const totalQtyAllLocations = await getTotalQuantityAllLocations(itemId);
                        if (totalQtyAllLocations === 0) {
                          console.log(`📦 Total inventory quantity across all locations is 0 for item ${itemId}, setting average cost to 0`);
                          await updateProductAverageCost(itemId, 0);
                        }
                      }
                    }
                  } catch (inventoryError) {
                    console.error(`❌ Failed to bulk update inventory for modified Invoice items:`, inventoryError.message);
                  }
                }

                // Step 3: Process newly created items (BULK - subtract from inventory)
                if (itemsToCreate.length > 0) {
                  try {
                    console.log(`🔄 Bulk processing ${itemsToCreate.length} newly created Invoice items (Basic form)`);

                    // Collect all new fulfillments
                    const newFulfillments = [];
                    const itemsToCheckZeroQty = [];

                    for (const createdItem of itemsToCreate) {
                      const itemId = createdItem.itemID || createdItem.itemId;
                      const quantity = parseFloat(createdItem.quantityDelivered || createdItem.quantity || 0);

                      if (itemId && locationId && quantity !== 0) {
                        newFulfillments.push({
                          itemId: itemId,
                          locationId: locationId,
                          fulfillmentQty: quantity,
                          mode: 'create'
                        });
                        itemsToCheckZeroQty.push(itemId);
                      }
                    }

                    // Execute bulk operation
                    if (newFulfillments.length > 0) {
                      const results = await bulkProcessItemFulfillment(newFulfillments);
                      console.log(`✅ Bulk processed fulfillments for ${newFulfillments.length} newly created Invoice items (Basic form)`);

                      // Check if any items have 0 total quantity and update average cost
                      for (const itemId of itemsToCheckZeroQty) {
                        const totalQtyAllLocations = await getTotalQuantityAllLocations(itemId);
                        if (totalQtyAllLocations === 0) {
                          console.log(`📦 Total inventory quantity across all locations is 0 for item ${itemId}, setting average cost to 0`);
                          await updateProductAverageCost(itemId, 0);
                        }
                      }
                    }
                  } catch (inventoryError) {
                    console.error(`❌ Failed to bulk process inventory for newly created Invoice items:`, inventoryError.message);
                  }
                }
              } else {
                console.log(`ℹ️ Skipping inventory decrease in edit mode - Invoice form type is not Basic`);
              }
            } catch (formFetchError) {
              console.error(`❌ Failed to fetch form details for Invoice:`, formFetchError.message);
            }
          }
        }
      }

    } catch (error) {
      throw error;
    }
  };

  // Helper function to create transaction line items
  const createTransactionLineItems = async (headerId, lineItems) => {

    // Define API endpoints and field mappings for each transaction type
    const transactionConfig = {
      SalesOrder: {
        endpoint: `${apiConfig.baseURL}/salesorderline`,
        idField: 'soid',
        quantityField: 'quantity'
      },
      ItemFulfillment: {
        endpoint: `${apiConfig.baseURL}/item-fulfilment-line`,
        idField: 'dnid',
        quantityField: 'quantity'
      },
      Invoice: {
        endpoint: `${apiConfig.baseURL}/invoice-line`,
        idField: 'inid',
        quantityField: 'quantityDelivered'
      },
      CreditMemo: {
        endpoint: `${apiConfig.baseURL}/credit-memo-line`,
        idField: 'cmid',
        quantityField: 'quantity'
      },
      DebitMemo: {
        endpoint: `${apiConfig.baseURL}/debit-memo-line`,
        idField: 'debitMemoId',
        quantityField: 'quantity'
      }
    };

    const config = transactionConfig[recordType];

    if (!config) {
      throw new Error(`Unsupported record type: ${recordType}`);
    }

    // Build all line payloads for bulk creation
    const linesToCreate = lineItems.map((line, index) => {
      let lineToProcess = line;

      // REMOVED: Auto-populated item ID handling

      // CRITICAL: For Invoice, use quantityDelivered field ONLY (not quantity)
      // This ensures we use the user-entered quantity, not the original item fulfillment quantity
      const quantity = recordType === 'Invoice'
        ? Number(lineToProcess.quantityDelivered || 0)
        : Number(lineToProcess.quantity || lineToProcess.quantityDelivered || 0);
      const rate = Number(lineToProcess.rate || 0);
      const taxPercent = Number(lineToProcess.taxPercent || 0);

      // Calculate amounts with proper rounding at each step (matching SalesItems.js)
      // Gross: round to 10 decimals
      const lineTotal = Math.round(quantity * rate * 10000000000) / 10000000000;
      // Subtotal: round to 2 decimals
      const subtotal = Math.round((lineTotal) * 100) / 100;
      // Tax: round to 2 decimals
      const taxAmount = Math.round(subtotal * taxPercent / 100 * 100) / 100;
      // Net: round to 2 decimals
      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

      // Build line payload based on transaction type
      const linePayload = {
        [config.idField]: headerId,
        itemID: lineToProcess.itemID?.value || lineToProcess.itemID,
        [config.quantityField]: quantity,
        rate: rate,
        taxID: lineToProcess.taxID?.value || lineToProcess.taxID,
        taxPercent: taxPercent,
        taxAmount: taxAmount,
        totalAmount: totalAmount
      };

      // Add parent line ID fields for proper duplicate item tracking
      if (recordType === 'ItemFulfillment' && lineToProcess.salesOrderLineId) {
        linePayload.salesOrderLineId = lineToProcess.salesOrderLineId;
      }
      if (recordType === 'Invoice') {
        // CRITICAL: Extract itemFulfillmentLineId from various possible field names
        const itemFulfillmentLineId = lineToProcess.itemFulfillmentLineId ||
          lineToProcess.ifLineId ||
          lineToProcess.dnid;

        if (itemFulfillmentLineId) {
          linePayload.itemFulfillmentLineId = itemFulfillmentLineId;
          console.log(`✅ [Invoice Create] Setting itemFulfillmentLineId: ${itemFulfillmentLineId} for item ${lineToProcess.itemID}`);
        } else {
          console.warn(`⚠️ [Invoice Create] No itemFulfillmentLineId found for line ${index + 1}! Item data:`, {
            itemID: lineToProcess.itemID,
            itemFulfillmentLineId: lineToProcess.itemFulfillmentLineId,
            ifLineId: lineToProcess.ifLineId,
            dnid: lineToProcess.dnid
          });
        }
      }

      // Log the payload BEFORE cleaning to see what we're sending
      console.log(`📤 [${recordType} Create] Payload BEFORE cleaning (line ${index + 1}):`, linePayload);
      const cleanedPayload = cleanPayload(linePayload);
      console.log(`📤 [${recordType} Create] Payload AFTER cleaning (line ${index + 1}):`, cleanedPayload);

      return cleanedPayload;
    });

    // Send bulk POST request with all lines
    const bulkPayload = {
      lines: linesToCreate
    };

    console.log(`📤 [${recordType} Bulk Create] Sending ${linesToCreate.length} lines in bulk:`, bulkPayload);

    const bulkResponse = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(bulkPayload)
    });

    if (!bulkResponse.ok) {
      const errorData = await bulkResponse.text();
      throw new Error(`Failed to create line items in bulk: ${bulkResponse.status} - ${errorData}`);
    }

    const bulkResult = await bulkResponse.json();
    console.log(`📥 [${recordType} Bulk Create] API Response:`, bulkResult);

    // Verify the API saved the itemFulfillmentLineId for Invoice records
    if (recordType === 'Invoice' && Array.isArray(bulkResult)) {
      bulkResult.forEach((result, index) => {
        if (result.itemFulfillmentLineId || result.ifLineId || result.dnid) {
          console.log(`✅ [Invoice Create] Line ${index + 1} API confirmed itemFulfillmentLineId was saved: ${result.itemFulfillmentLineId || result.ifLineId || result.dnid}`);
        } else {
          console.error(`❌ [Invoice Create] Line ${index + 1} API did NOT return itemFulfillmentLineId! Response:`, result);
        }
      });
    }

    // For ItemFulfillment: Update SalesOrderLine quantities after creating line items
    if (recordType === 'ItemFulfillment') {
      // Add the headerId (fulfillment ID) to line items so we can fetch SOID if needed
      const enrichedLineItems = lineItems.map(item => ({
        ...item,
        fulfillmentId: headerId
      }));
      await updateSalesOrderLineQuantities(enrichedLineItems, false, []);

      // Update inventory - subtract quantities from location (BULK - items leaving warehouse)
      if (selectedLocation && lineItems.length > 0) {
        try {
          const locationId = selectedLocation?.value || selectedLocation;

          console.log(`🔄 Bulk processing ${lineItems.length} ItemFulfillments for create mode`);

          // Collect all fulfillments
          const fulfillments = [];
          const itemsToCheckZeroQty = [];

          for (const line of lineItems) {
            const itemId = line.itemID?.value || line.itemID;
            const quantity = Number(line.quantity || 0);

            if (itemId && locationId && quantity !== 0) {
              fulfillments.push({
                itemId: itemId,
                locationId: locationId,
                fulfillmentQty: quantity,
                mode: 'create'
              });
              itemsToCheckZeroQty.push(itemId);
            }
          }

          // Execute bulk operation
          if (fulfillments.length > 0) {
            const results = await bulkProcessItemFulfillment(fulfillments);
            console.log(`✅ Bulk processed fulfillments for ${fulfillments.length} items in create mode`);

            // Check if any items have 0 total quantity and update average cost
            for (const itemId of itemsToCheckZeroQty) {
              const totalQtyAllLocations = await getTotalQuantityAllLocations(itemId);
              if (totalQtyAllLocations === 0) {
                console.log(`📦 Total inventory quantity across all locations is 0 for item ${itemId}, setting average cost to 0`);
                await updateProductAverageCost(itemId, 0);
              }
            }
          }
        } catch (inventoryError) {
          console.error(`❌ Failed to bulk update inventory in create mode:`, inventoryError.message);
          // Don't throw here - we want the fulfillment creation to succeed even if inventory update fails
        }
      }
    }

    // For Invoice: Update ItemFulfillmentLine quantities for partial invoicing
    if (recordType === 'Invoice') {
      const enrichedLineItems = lineItems.map(item => ({
        ...item,
        invoiceId: headerId
      }));
      await updateItemFulfillmentLineQuantities(enrichedLineItems, false, []);

      // Update inventory - subtract quantities from location ONLY if formType is Basic
      const BASIC_FORM_TYPE_ID = '3ddc355d-d7e9-4ae3-bdb5-386012fd9a6f';
      const formIdValue = lineItems[0]?.form?.value || lineItems[0]?.form;

      if (formIdValue && selectedLocation && lineItems.length > 0) {
        try {
          // Fetch form details to check formType
          const formDetails = await fetchFormDetails(formIdValue);

          if (formDetails && formDetails.formType === BASIC_FORM_TYPE_ID) {
            const locationId = selectedLocation?.value || selectedLocation;

            console.log(`🔄 Bulk processing ${lineItems.length} Invoice items for create mode (Basic form type)`);

            // Collect all fulfillments
            const fulfillments = [];
            const itemsToCheckZeroQty = [];

            for (const line of lineItems) {
              const itemId = line.itemID?.value || line.itemID;
              const quantity = Number(line.quantity || 0);

              if (itemId && locationId && quantity !== 0) {
                fulfillments.push({
                  itemId: itemId,
                  locationId: locationId,
                  fulfillmentQty: quantity,
                  mode: 'create'
                });
                itemsToCheckZeroQty.push(itemId);
              }
            }

            // Execute bulk operation
            if (fulfillments.length > 0) {
              const results = await bulkProcessItemFulfillment(fulfillments);
              console.log(`✅ Bulk processed Invoice fulfillments for ${fulfillments.length} items in create mode (Basic form)`);

              // Check if any items have 0 total quantity and update average cost
              for (const itemId of itemsToCheckZeroQty) {
                const totalQtyAllLocations = await getTotalQuantityAllLocations(itemId);
                if (totalQtyAllLocations === 0) {
                  console.log(`📦 Total inventory quantity across all locations is 0 for item ${itemId}, setting average cost to 0`);
                  await updateProductAverageCost(itemId, 0);
                }
              }
            }
          } else {
            console.log(`ℹ️ Skipping inventory decrease - Invoice form type is not Basic`);
          }
        } catch (inventoryError) {
          console.error(`❌ Failed to bulk update inventory for Invoice in create mode:`, inventoryError.message);
          // Don't throw here - we want the invoice creation to succeed even if inventory update fails
        }
      }
    }
  };


  const normalizeArrayValues = (valueArray) => {
    return valueArray.map(item => {
      if (item === null || item === undefined) return item;
      if (typeof item === 'object') {
        if (item.value !== undefined) return item.value;
        if (item.id !== undefined) return item.id;
      }
      return item;
    });
  };

  const normalizeCustomFieldValueForComparison = (value) => {
    if (Array.isArray(value)) {
      return JSON.stringify(normalizeArrayValues(value));
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';
      if ((trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return JSON.stringify(parsed);
          }
        } catch {
          // Ignore JSON parse errors and treat as plain string
        }
      }
      return trimmed;
    }

    if (value instanceof Date && !isNaN(value)) {
      return value.toISOString();
    }

    if (value === null || value === undefined) {
      return '';
    }

    return value;
  };

  const formatCustomFieldValue = (value) => {
    if (Array.isArray(value)) {
      return JSON.stringify(normalizeArrayValues(value));
    }

    if (value instanceof Date && !isNaN(value)) {
      return value.toISOString();
    }

    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  };

  const areCustomFieldValuesEqual = (a, b) => {
    return normalizeCustomFieldValueForComparison(a) === normalizeCustomFieldValueForComparison(b);
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
        valueText: formatCustomFieldValue(fieldValue),
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
      if (!areCustomFieldValuesEqual(originalValue, fieldValue)) {
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
        valueText: formatCustomFieldValue(fieldValue),
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
  const updateRecord = async (standardData, customData, typeOfRecordId, formValues) => {
    if (!transactionHook) {
      throw new Error(`No hook available for record type: ${recordType}`);
    }

    // Calculate totals directly from formValues.items
    const lineItems = formValues?.items || [];
    const calculatedTotals = calculateTotalsFromItems(lineItems);

    console.log('📊 Edit mode - Calculated totals from items:', calculatedTotals);

    let transactionData
    if (recordType == "Invoice") {
      const totalTaxPercent = calculatedTotals.totalTaxPercent;
      const averageTax = Math.round((totalTaxPercent / calculatedTotals.totalItemcount) * 100) / 100;
      const discount = standardData.discount;
      const subTotal = Math.round(((calculatedTotals.totalRate - discount) * 100)) / 100;
      const calculatedTax = Math.round(subTotal * averageTax / 100 * 100) / 100;
      const NetAmount = Math.round((subTotal + calculatedTax) * 100) / 100;
      const calculatedAmountDue = ((calculatedTotals.totalAmount) - (standardData.amountPaid || 0));

      transactionData = {
        ...standardData,
        request: "update",  // Required field for the API
        totalAmount: calculatedTotals.totalAmount,
        grossAmount: calculatedTotals.totalRate,      // Sum of all subtotals (quantity × rate)
        taxTotal: calculatedTax,    // Sum of all tax amounts
        subTotal: subTotal,         // Sum of all subtotals before tax
        netTotal: NetAmount,        // Final total including tax
        amountDue: calculatedAmountDue  // Recalculated based on totalAmount - amountPaid
      };
    } else if (recordType == "DebitMemo") {
      const calculatedAmountDue = ((calculatedTotals.totalAmount) - (standardData.amountPaid || 0));
      transactionData = {
        ...standardData,
        id,
        request: "update",  // Required field for the API
        totalAmount: calculatedTotals.totalAmount,
        grossAmount: calculatedTotals.totalRate,      // Sum of all subtotals (quantity × rate)
        taxTotal: calculatedTotals.totalTaxAmount,    // Sum of all tax amounts
        subTotal: calculatedTotals.totalRate,         // Sum of all subtotals before tax
        netTotal: calculatedTotals.totalAmount,       // Final total including tax
        amountDue: calculatedAmountDue  // Recalculated based on totalAmount - amountPaid
      };
    } else {
      // Stage 1: Update the main record with standard data and detailed totals
      transactionData = {
        ...standardData,
        id,
        request: "update",  // Required field for the API
        totalAmount: calculatedTotals.totalAmount,
        grossAmount: calculatedTotals.totalRate,      // Sum of all subtotals (quantity × rate)
        taxTotal: calculatedTotals.totalTaxAmount,    // Sum of all tax amounts
        subTotal: calculatedTotals.totalRate,         // Sum of all subtotals before tax
        netTotal: calculatedTotals.totalAmount        // Final total including tax
      };
    }

    try {
      switch (recordType) {
        case 'SalesOrder':
          if (!transactionHook.updateSalesOrder) {
            throw new Error('updateSalesOrder method not available');
          }
          await transactionHook.updateSalesOrder(id, transactionData);
          break;

        case 'ItemFulfillment':
          if (!transactionHook.updateItemFulfillment) {
            throw new Error('updateItemFulfillment method not available');
          }
          console.log("transactionData", JSON.stringify(transactionData))
          await transactionHook.updateItemFulfillment(id, transactionData);
          break;

        case 'Invoice':
          if (!transactionHook.updateInvoice) {
            throw new Error('updateInvoice method not available');
          }
          await transactionHook.updateInvoice(id, transactionData);
          break;

        case 'CreditMemo':
          if (!transactionHook.updateCreditMemo) {
            throw new Error('updateCreditMemo method not available');
          }
          await transactionHook.updateCreditMemo(id, transactionData);
          break;

        case 'DebitMemo':
          if (!transactionHook.updateDebitMemo) {
            throw new Error('updateDebitMemo method not available');
          }
          await transactionHook.updateDebitMemo(id, transactionData);
          break;

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

  // Main submit handler - optimized and clean
  const handleSubmit = async (formValues) => {
    console.log('handleSubmit called for:', recordType, 'mode:', mode, 'formValues:', formValues);

    // Handle undefined formValues
    if (!formValues) {
      console.error('formValues is undefined, cannot proceed with submission');
      setError('Form data is not available. Please refresh and try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { standardData, customData } = separateFormData(formValues);
      const typeOfRecordId = getTypeOfRecordId();

      console.log('Separated data:', { standardData, customData, typeOfRecordId });

      // Validate inventory availability for ItemFulfillment before saving
      if (recordType === 'ItemFulfillment' && formValues.items && formValues.items.length > 0) {
        console.log('🔍 Validating inventory availability for ItemFulfillment...');
        const validationResult = await validateInventoryAvailability(formValues.items, selectedLocation);

        if (!validationResult.isValid) {
          const errorMessages = validationResult.errors.map(err => err.message).join('\n');
          console.error('❌ Inventory validation failed:', validationResult.errors);

          // Show alert dialog instead of throwing error
          alert(`Inventory validation failed:\n\n${errorMessages}`);
          setLoading(false);
          return; // Stop the save operation
        }
        console.log('✅ Inventory validation passed');
      }

      if (mode === 'new') {
        // Stage 1: Create main record
        const recordId = await createMainRecord(standardData, formValues);

        // Stage 2: Update form sequence (non-critical) - only if form field exists and form is selected
        const hasFormField = formConfig?.standardFields?.some(field => field.name === 'form');
       

        // Stage 3: Create custom field values
        await createCustomFieldValues(customData, recordId, typeOfRecordId);

        // Success notification
        showNotification(`${recordType} created successfully with ${Object.keys(customData).length} custom fields`, 'success');

        // Clear sessionStorage after successful creation
        if (recordType === 'ItemFulfillment') {
          sessionStorage.removeItem('salesOrderDataForFulfillment');
        }
        if (recordType === 'Invoice') {
          sessionStorage.removeItem('itemFulfillmentDataForBilling');
        }
      } else {
        // Update mode - following FormCreator.js exact pattern

        // Stage 1: Update main transaction record
        const customFieldCount = await updateRecord(standardData, customData, typeOfRecordId, formValues);

        // Stage 2: Handle line items updates (exact FormCreator.js pattern)
        if (formValues.items && formValues.items.length > 0) {
          console.log("formValues.items", formValues.items)
          await updateTransactionLineItemsSimple(formValues.items);
        }

        // Stage 3: Handle Credit Memo Payment Lines in edit mode
        if (recordType === 'CreditMemo' && creditMemoPaymentLineData && creditMemoPaymentLineData.invoices?.length > 0) {
          const checkedInvoices = creditMemoPaymentLineData.invoices.filter(invoice => invoice.checked) || [];
          const paymentLineItems = [...checkedInvoices];

          if (paymentLineItems.length > 0) {
            await updateCreditMemoTransactionLineItems(paymentLineItems);

            // Update record amounts using edit mode specific logic
            const originalPaymentData = creditMemoPaymentLineData.originalData || {};
            await updateCreditMemoRecordAmountsEditMode(creditMemoPaymentLineData, originalPaymentData);
          }
        }

        // Step 1: VALIDATE new journal entry lines BEFORE deleting old ones
        if (formValues.items && formValues.items.length > 0 && recordType !== 'SalesOrder') {
          const lineItems = formValues.items || [];

          // Validate JV lines first
          let jvValidation;
          if (recordType === "Invoice") {
            const calculatedTotals = calculateTotalsFromItems(lineItems);
            jvValidation = await generateJvLines(lineItems, standardData.form, itemsTotalAmount, recordType, standardData.discount, calculatedTotals);
          } else {
            jvValidation = await generateJvLines(lineItems, standardData.form, itemsTotalAmount, recordType);
          }

          // If validation fails, stop and show error (don't delete anything!)
          if (!jvValidation.isValid) {
            alert(jvValidation.errorMessage);
            setLoading(false);
            return;
          }

          // Step 2: Validation passed - now safe to delete old journal entry lines
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
              } else if (existingData.results && Array.isArray(existingData.results)) {
                existingItems = existingData.results;
              } else if (existingData.lines && Array.isArray(existingData.lines)) {
                existingItems = existingData.lines;
              } else {
                // Check for arrays in object properties
                const possibleArrays = Object.values(existingData).filter(value => Array.isArray(value));
                if (possibleArrays.length > 0) {
                  existingItems = possibleArrays[0];
                }
              }
            }

            // Delete all line items using processJournal
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
            throw error; // Re-throw to stop execution
          }

          // Step 3: Create new validated journal entry lines
          const jvLinesWithRecordId = jvValidation.jvLines.map(line => ({
            ...line,
            recordId: id,
            recordType: recordType,
            id: null // New records
          }));

          console.log('🔄 Creating new validated JV lines:', jvLinesWithRecordId);
          await processJournal(jvLinesWithRecordId, 'new', id, recordType);
        }




        // Stage 4: Auto-update parent record status to "Closed" if fully fulfilled/invoiced (for updates)
        await updateParentRecordStatusIfComplete(recordType, standardData);

        showNotification(`${recordType} updated successfully with ${customFieldCount} custom fields`, 'success');
      }

      // Clear sessionStorage after successful submission
      if (recordType === 'ItemFulfillment' && mode === 'new') {
        sessionStorage.removeItem('salesOrderDataForFulfillment');
      }
      if (recordType === 'Invoice' && mode === 'new') {
        sessionStorage.removeItem('itemFulfillmentDataForBilling');
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
    if (!transactionHook) {
      showNotification(`No hook available for ${recordType}`, 'error');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the same dynamic configuration as other functions
      const transactionConfig = {
        SalesOrder: {
          endpoint: `${apiConfig.baseURL}/salesorderline`,
          getEndpoint: `${apiConfig.baseURL}/salesorderline/by-salesorder/${id}`,
          idField: 'soid',
          quantityField: 'quantity'
        },
        ItemFulfillment: {
          endpoint: `${apiConfig.baseURL}/item-fulfilment-line`,
          getEndpoint: `${apiConfig.baseURL}/item-fulfilment-line/by-item-fulfilment/${id}`,
          idField: 'dnid',
          quantityField: 'quantity'
        },
        Invoice: {
          endpoint: `${apiConfig.baseURL}/invoice-line`,
          getEndpoint: `${apiConfig.baseURL}/invoice-line/by-invoice/${id}`,
          idField: 'inid',
          quantityField: 'quantityDelivered'
        },
        CreditMemo: {
          endpoint: `${apiConfig.baseURL}/credit-memo-line`,
          getEndpoint: `${apiConfig.baseURL}/credit-memo-line/by-credit-memo/${id}`,
          idField: 'cmid',
          quantityField: 'quantity'
        },
        DebitMemo: {
          endpoint: `${apiConfig.baseURL}/debit-memo-line`,
          getEndpoint: `${apiConfig.baseURL}/debit-memo-line/by-debit-memo/${id}`,
          idField: 'debitMemoId',
          quantityField: 'quantity'
        }
      };

      const config = transactionConfig[recordType];

      // For Credit Memo: Reverse applied amounts first, then delete payment lines
      if (recordType === 'CreditMemo') {

        // Step 1: Load existing payment lines and reverse applied amounts BEFORE deleting them
        try {
          const existingPaymentLines = await loadCreditMemoPaymentLines(id);
          console.log('Existing payment lines:', existingPaymentLines);
          if (existingPaymentLines.length > 0) {
            // Create a structure similar to creditMemoPaymentLineData for reversal
            const reversalData = {
              invoices: existingPaymentLines.map(pl => ({
                id: pl.recordID,
                type: pl.recordType,
                displayAmount: pl.paymentAmount, // Pass positive amount, delete mode will handle reversal
                checked: true,
                dueAmount: pl.mainRecordAmount,
              }))
            };
            await updateAppliedRecordAmounts(reversalData, 'delete');
          }
        } catch (error) {
          console.error('❌ Error reversing applied record amounts:', error);
          // Continue with deletion - don't fail the entire process
        }

        // Step 2: Now delete Credit Memo Payment Lines
        await deleteCreditMemoPaymentLines(id);
      }

      // For records with line items, delete line items first
      if (config && config.getEndpoint) {

        // Step 1: Get existing line items (same pattern as updateTransactionLineItemsSimple)
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

        // For ItemFulfillment: Reverse SalesOrderLine quantities before deleting
        if (recordType === 'ItemFulfillment' && existingItems.length > 0) {
          await updateSalesOrderLineQuantities([], true, existingItems);

          // Reverse inventory changes - add quantities back to location
          if (selectedLocation) {
            const locationId = selectedLocation?.value || selectedLocation;

            for (const item of existingItems) {
              try {
                const itemId = item.itemID || item.itemId;
                const quantity = parseFloat(item.quantity || 0);

                if (itemId && locationId && quantity !== 0) {
                  console.log(`Reversing inventory for deleted fulfillment item ${itemId}: +${quantity}`);

                  // Reverse inventory - just add back the quantity
                  const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
                  if (inventoryDetail) {
                    const currentQty = Number(inventoryDetail.quantityAvailable || 0);
                    const newQty = currentQty + quantity; // Add back the quantity

                    await setInventoryQuantity({
                      itemId: itemId,
                      locationId: locationId,
                      quantity: newQty
                    });

                    console.log(`✅ Inventory reversed for deleted fulfillment item ${itemId}: ${currentQty} → ${newQty}`);
                  }
                }
              } catch (inventoryError) {
                console.error(`❌ Failed to reverse inventory for deleted fulfillment item ${item.itemID}:`, inventoryError.message);
                // Don't throw here - we want the deletion to succeed even if inventory update fails
              }
            }
          }
        }

        // For Invoice: Reverse ItemFulfillmentLine quantities before deleting
        if (recordType === 'Invoice' && existingItems.length > 0) {
          console.log('🔍 [Invoice Delete] Existing invoice lines before reversal:', existingItems.map(item => ({
            id: item.id,
            itemID: item.itemID,
            itemFulfillmentLineId: item.itemFulfillmentLineId || item.ifLineId || item.dnid,
            quantityDelivered: item.quantityDelivered,
            quantity: item.quantity
          })));

          // Ensure each invoice line has the itemFulfillmentLineId field for proper reversal
          // The API should return this field, but we'll check and log warnings if missing
          existingItems.forEach(item => {
            const itemFulfillmentLineId = item.itemFulfillmentLineId || item.ifLineId || item.dnid;
            if (!itemFulfillmentLineId) {
              console.warn(`⚠️ [Invoice Delete] Invoice line ${item.id} missing itemFulfillmentLineId! Using itemID fallback.`);
            }
          });

          await updateItemFulfillmentLineQuantities([], true, existingItems);
        }


        // Step 2: Delete all line items using bulk DELETE
        if (existingItems.length > 0) {
          const idsToDelete = existingItems.map(item => item.id).filter(id => id);

          if (idsToDelete.length > 0) {
            const bulkDeletePayload = {
              ids: idsToDelete
            };

            console.log(`📤 [${recordType} Delete - Bulk Delete Lines] Sending ${idsToDelete.length} IDs:`, bulkDeletePayload);

            const bulkDeleteResponse = await fetch(config.endpoint, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(bulkDeletePayload)
            });

            if (!bulkDeleteResponse.ok) {
              const errorData = await bulkDeleteResponse.text();
              throw new Error(`Failed to bulk delete ${idsToDelete.length} line items: ${bulkDeleteResponse.status} - ${errorData}`);
            }

            console.log(`✅ [${recordType} Delete] Successfully deleted ${idsToDelete.length} line items in bulk`);
          }
        }
      }

      // Now delete the main record
      let deleteMethod;
      switch (recordType) {
        case 'SalesOrder':
          deleteMethod = transactionHook.deleteSalesOrder;
          break;
        case 'ItemFulfillment':
          deleteMethod = transactionHook.deleteItemFulfillment;
          break;
        case 'Invoice':
          deleteMethod = transactionHook.deleteInvoice;
          break;
        case 'CreditMemo':
          deleteMethod = transactionHook.deleteCreditMemo;
          break;
        case 'DebitMemo':
          deleteMethod = transactionHook.deleteDebitMemo;
          break;
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }

      if (!deleteMethod) {
        throw new Error(`Delete method not available for ${recordType}`);
      }

      await deleteMethod(id);

      // Delete associated journal entry lines
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

      // Step 5: Delete custom field values for this record
      try {
        const typeOfRecordId = getTypeOfRecordIdDirect(formConfig, recordTypes, recordType);
        await deleteCustomFieldValues(id, typeOfRecordId);
      } catch (error) {
        console.error('Error deleting custom field values:', error);
        // Don't throw - continue with the deletion flow
      }

      showNotification(`${recordType} deleted successfully!`, 'success');
      setDeleteDialogOpen(false);

      // Navigate back to the appropriate list page
      const navigationPath = navigationPaths[recordType] || '/';
      navigate(navigationPath);

    } catch (error) {
      showNotification(`Failed to delete ${recordType}: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get default form for a record type
  const getDefaultFormForRecordType = async (recordTypeName) => {
    try {
      // Get fresh record types data if recordTypes state is empty
      let recordTypesData = recordTypes;
      if (!recordTypesData || recordTypesData.length === 0) {
        recordTypesData = await fetchRecordTypes();
      }

      // Get the record type ID
      const recordType = recordTypesData.find(rt =>
        rt.name?.toLowerCase() === recordTypeName.toLowerCase()
      );

      console.log('recordType', recordType);
      if (!recordType) {
        console.warn(`Record type not found: ${recordTypeName}`);
        return null;
      }

      // Get default form for this record type
      const response = await fetch(`${apiConfig.baseURL}/form/default-form-id/${recordType.id}`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });


      if (response.ok) {
        const defaultFormId = await response.text();
        console.log('defaultFormId', defaultFormId);
        // Remove surrounding quotes if present
        const cleanFormId = defaultFormId?.replace(/^["']|["']$/g, '').trim();
        return cleanFormId || null;
      } else if (response.status === 404) {
        console.warn(`No default form found for record type: ${recordTypeName}`);
        return null;
      } else {
        console.error(`Failed to get default form for ${recordTypeName}: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error(`Error getting default form for ${recordTypeName}:`, error);
      return null;
    }
  };

  const handleFulfill = async () => {
    console.log('🔵 handleFulfill started');
    console.log('🔵 Current ID:', id);
    console.log('🔵 Current formData:', formData);
    console.log('🔵 Record types state:', recordTypes);

    try {
      console.log('🟡 Calling getDefaultFormForRecordType with "ItemFulfillment"');
      // Get default form for ItemFulfillment
      const defaultFormId = await getDefaultFormForRecordType('ItemFulfillment');
      console.log('🟢 Default form ID received:', defaultFormId);

      // Get all sales order lines directly (not using unfulfilled API to handle duplicates correctly)
      const soLinesUrl = `${apiConfig.baseURL}/salesorderline/by-salesorder/${id}`;
      console.log('🟡 Making API call to:', soLinesUrl);

      const response = await fetch(soLinesUrl, {
        method: 'GET',
        headers: apiConfig.headers
      });

      console.log('🟡 API response status:', response.status);
      console.log('🟡 API response ok:', response.ok);

      if (!response.ok) {
        throw new Error('Failed to fetch sales order lines');
      }

      const responseData = await response.json();
      const allSalesOrderLines = Array.isArray(responseData) ? responseData :
        (responseData.results || Object.values(responseData).find(v => Array.isArray(v)) || []);
      console.log('🟢 All sales order lines received:', allSalesOrderLines);

      // Filter to only unfulfilled items (where remaining quantity > 0) and calculate remaining qty per line
      const unfulfilledItems = allSalesOrderLines
        .map(item => {
          const orderedQty = parseFloat(item.quantity || 0);
          const fulfilledQty = parseFloat(item.fulFillQty || 0);
          // IMPORTANT: Ensure remainingQty is never negative (Math.max ensures floor of 0)
          const remainingQty = Math.max(0, orderedQty - fulfilledQty);

          return {
            ...item,
            remainingQty: remainingQty,
            quantity: remainingQty  // Set quantity to remaining for fulfillment
          };
        })
        .filter(item => item.remainingQty > 0);  // Only include items with remaining quantity

      console.log('🟢 Unfulfilled items with correct remaining qty:', unfulfilledItems);

      // Process items to add parent line tracking and tempId for client-side uniqueness
      // IMPORTANT: Each sales order line MUST remain separate even if they have the same itemID
      // DO NOT group or combine lines - each line is tracked individually by salesOrderLineId
      const processedItems = (unfulfilledItems || []).map(item => {
        const orderedQty = parseFloat(item.quantity || 0);  // This is already set to remainingQty above
        const fulfilledQty = parseFloat(item.fulFillQty || 0);
        // IMPORTANT: Ensure remainingQty is never negative (Math.max ensures floor of 0)
        const remainingQty = Math.max(0, item.remainingQty || orderedQty);  // Use pre-calculated remainingQty
        const rate = parseFloat(item.rate || 0);
        const taxPercent = parseFloat(item.taxPercent || 0);

        // Calculate with proper rounding at each step
        // Gross: round to 10 decimals
        const lineTotal = Math.round(remainingQty * rate * 10000000000) / 10000000000;
        // Subtotal: round to 2 decimals
        const subtotal = Math.round(lineTotal * 100) / 100;
        // Tax: round to 2 decimals
        const taxAmount = Math.round(subtotal * taxPercent / 100 * 100) / 100;
        // Net: round to 2 decimals
        const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

        return {
          ...item,
          salesOrderLineId: item.id,  // Parent SO line ID for tracking (UNIQUE per line)
          tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Client-side unique ID
          quantity: remainingQty,  // Remaining unfulfilled quantity for THIS specific line
          quantityDelivered: remainingQty,  // For ItemFulfillment - remaining qty for THIS specific line
          totalAmount: totalAmount,
          taxAmount: taxAmount,
          // Preserve original quantities for reference
          originalOrderedQty: parseFloat(item.quantity || 0) + fulfilledQty,  // Original ordered quantity before fulfillment
          remainingQty: remainingQty  // Explicit remaining quantity
        };
      });

      console.log('🟢 Processed items with parent tracking:', processedItems);

      // Navigate to ItemFulfillment new form with SalesOrder data
      const salesOrderData = {
        soid: id,
        customerID: formData.customerID,
        locationID: formData.locationID,
        soDate: formData.soDate,
        deliveryDate: formData.deliveryDate,
        discount: formData.discount,
        totalAmount: formData.totalAmount,
        items: processedItems,
        form: defaultFormId
      };

      console.log('🟢 Sales order data prepared:', salesOrderData);

      // Store the sales order data in sessionStorage to pass to ItemFulfillment form
      console.log('[handleFulfill] Storing salesOrderData in sessionStorage:', salesOrderData);
      sessionStorage.setItem('salesOrderDataForFulfillment', JSON.stringify(salesOrderData));
      console.log('[handleFulfill] SessionStorage set, navigating to ItemFulfillment form');
      console.log('🟢 Data stored in sessionStorage');

      // Navigate to ItemFulfillment new form
      console.log('🟢 Navigating to /item-fulfillment/new');
      navigate('/item-fulfillment/new');
    } catch (error) {
      console.error('🔴 Error in handleFulfill:', error);
      console.log('🟡 Falling back to existing formData.items');

      // Fallback to using existing formData.items if API call fails
      // Get default form for ItemFulfillment (fallback)
      console.log('🟡 Getting default form ID for fallback');
      const defaultFormId = await getDefaultFormForRecordType('ItemFulfillment');
      console.log('🟢 Fallback default form ID:', defaultFormId);

      // Process fallback items with parent line tracking
      // IMPORTANT: Each sales order line MUST remain separate even if they have the same itemID
      // DO NOT group or combine lines - each line is tracked individually by salesOrderLineId
      const processedFallbackItems = (formData.items || []).map(item => {
        const orderedQty = parseFloat(item.quantity || 0);
        const fulfilledQty = parseFloat(item.fulFillQty || 0);
        // IMPORTANT: Ensure remainingQty is never negative (Math.max ensures floor of 0)
        const remainingQty = Math.max(0, orderedQty - fulfilledQty);

        return {
          ...item,
          salesOrderLineId: item.id,  // Parent SO line ID for tracking (UNIQUE per line)
          tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Client-side unique ID
          quantity: remainingQty,  // Remaining unfulfilled quantity for THIS specific line
          quantityDelivered: remainingQty,  // For ItemFulfillment - remaining qty for THIS specific line
          // Preserve original quantities for reference
          originalOrderedQty: orderedQty,  // Original ordered quantity
          remainingQty: remainingQty  // Explicit remaining quantity
        };
      });

      const salesOrderData = {
        soid: id,
        customerID: formData.customerID,
        locationID: formData.locationID,
        soDate: formData.soDate,
        deliveryDate: formData.deliveryDate,
        discount: formData.discount,
        totalAmount: formData.totalAmount,
        items: processedFallbackItems,
        form: defaultFormId
      };

      console.log('🟢 Fallback sales order data prepared:', salesOrderData);
      sessionStorage.setItem('salesOrderDataForFulfillment', JSON.stringify(salesOrderData));
      console.log('🟢 Fallback data stored in sessionStorage');
      console.log('🟢 Navigating to /item-fulfillment/new (fallback)');
      navigate('/item-fulfillment/new');
    }
  };

  const handleBill = async () => {
    try {
      // Get default form for Invoice
      const defaultFormId = await getDefaultFormForRecordType('Invoice');

      // Get all item fulfillment lines directly (not using unfulfilled API to handle duplicates correctly)
      const ifLinesUrl = `${apiConfig.baseURL}/item-fulfilment-line/by-item-fulfilment/${id}`;
      console.log('🟡 Making API call to:', ifLinesUrl);

      const response = await fetch(ifLinesUrl, {
        method: 'GET',
        headers: apiConfig.headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch item fulfillment lines');
      }

      const responseData = await response.json();
      const allItemFulfillmentLines = Array.isArray(responseData) ? responseData :
        (responseData.lines || responseData.results || Object.values(responseData).find(v => Array.isArray(v)) || []);
      console.log('🟢 All item fulfillment lines received:', allItemFulfillmentLines);

      // Filter to only uninvoiced items (where remaining quantity > 0) and calculate remaining qty per line
      const uninvoicedItems = allItemFulfillmentLines
        .map(item => {
          const deliveredQty = parseFloat(item.quantity || 0);
          const invoicedQty = parseFloat(item.invoicedQty || 0);
          // IMPORTANT: Ensure remainingQty is never negative (Math.max ensures floor of 0)
          const remainingQty = Math.max(0, deliveredQty - invoicedQty);

          return {
            ...item,
            remainingQty: remainingQty,
            quantity: remainingQty  // Set quantity to remaining for invoicing
          };
        })
        .filter(item => item.remainingQty > 0);  // Only include items with remaining quantity

      console.log('🟢 Uninvoiced items with correct remaining qty:', uninvoicedItems);

      // Process items to add parent line tracking and tempId for client-side uniqueness
      const processedItems = (uninvoicedItems || []).map(item => {
        const quantity = parseFloat(item.quantity || 0);
        const rate = parseFloat(item.rate || 0);
        const taxPercent = parseFloat(item.taxPercent || 0);

        // Calculate with proper rounding at each step
        // Gross: round to 10 decimals
        const lineTotal = Math.round(quantity * rate * 10000000000) / 10000000000;
        // Subtotal: round to 2 decimals
        const subtotal = Math.round(lineTotal * 100) / 100;
        // Tax: round to 2 decimals
        const taxAmount = Math.round(subtotal * taxPercent / 100 * 100) / 100;
        // Net: round to 2 decimals
        const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

        return {
          ...item,
          itemFulfillmentLineId: item.id,  // Parent IF line ID for tracking
          salesOrderLineId: item.salesOrderLineId || item.soid,  // Original SO line ID (if available)
          tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Client-side unique ID
          quantity: item.quantity || 0,  // Remaining uninvoiced quantity (already calculated above)
          quantityInvoiced: item.quantity || 0,  // For Invoice
          quantityDelivered: item.quantity || 0,
          totalAmount: totalAmount,
          taxAmount: taxAmount,
        }
      });

      console.log('🟢 Processed invoice items with parent tracking:', processedItems);

      // Navigate to Invoice new form with ItemFulfillment data
      const itemFulfillmentData = {
        dnid: id,
        customerID: formData.customerID,
        locationID: formData.locationID,
        deliveryDate: formData.deliveryDate,
        discount: formData.discount,
        totalAmount: formData.totalAmount,
        items: processedItems,
        form: defaultFormId
      };

      // Store the item fulfillment data in sessionStorage to pass to Invoice form
      sessionStorage.setItem('itemFulfillmentDataForBilling', JSON.stringify(itemFulfillmentData));

      // Navigate to Invoice new form
      navigate('/invoice/new');
    } catch (error) {
      console.error('Error fetching uninvoiced items:', error);
      // Fallback to using existing formData.items if API call fails
      // Get default form for Invoice (fallback)
      const defaultFormId = await getDefaultFormForRecordType('Invoice');

      // Process fallback items with parent line tracking
      const processedFallbackItems = (formData.items || []).map(item => ({
        ...item,
        itemFulfillmentLineId: item.id,  // Parent IF line ID for tracking
        salesOrderLineId: item.salesOrderLineId || item.soid,  // Original SO line ID
        tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Client-side unique ID
        quantity: item.quantity || 0,
        quantityInvoiced: item.quantity || 0,
        quantityDelivered: item.quantity || 0
      }));

      const itemFulfillmentData = {
        dnid: id,
        customerID: formData.customerID,
        locationID: formData.locationID,
        deliveryDate: formData.deliveryDate,
        discount: formData.discount,
        totalAmount: formData.totalAmount,
        items: processedFallbackItems,
        form: defaultFormId
      };

      sessionStorage.setItem('itemFulfillmentDataForBilling', JSON.stringify(itemFulfillmentData));
      navigate('/invoice/new');
    }
  };

  const handleFormSelection = useCallback(async (selectedValue) => {
    if (!selectedValue) {
      setCustomFormFields([]);
      setCustomFormData({});
      setCustomFieldValueIds({});
      setOriginalCustomFormData({});
      setSelectedFormId(null);
      setFormData(prev => ({ ...prev, sequenceNumber: null }));
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
        console.log(`DEBUG: Form config standard fields:`, formConfig?.standardFields?.map(f => f.name));
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
        console.log(`DEBUG: Setting sequence number in form data: ${generatedSequenceNumber}`);
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
    // Special handling for parent dropdown - use name field directly
    if (fieldName === 'parent' && obj.name) {
      return obj.name;
    }

    const normalizedFieldName = fieldName ? fieldName.toLowerCase() : '';

    const isItemFulfillmentField =
      normalizedFieldName === 'dnid' ||
      normalizedFieldName === 'itemfulfillment' ||
      normalizedFieldName === 'itemfulfillmentid' ||
      normalizedFieldName === 'ifid' ||
      normalizedFieldName.includes('itemfulfillment') ||
      normalizedFieldName.includes('item_fulfillment') ||
      normalizedFieldName.includes('fulfillment');

    if (isItemFulfillmentField && obj.sequenceNumber) {
      return obj.sequenceNumber;
    }

    // Special handling for form dropdown - prioritize formName
    if (fieldName === 'form' && obj.formName) {
      return obj.formName;
    }

    if (fieldName === 'status' && obj.statusName) {
      return obj.statusName;
    }

    // Special handling for salesorder dropdown - use sequenceNumber instead of customer
    const isSalesOrderField = fieldName === 'salesorder' ||
      fieldName === 'soid' ||
      fieldName === 'soId' ||
      fieldName === 'salesOrderId' ||
      fieldName.toLowerCase().includes('salesorder') ||
      fieldName.toLowerCase().includes('sales_order') ||
      fieldName.toLowerCase().includes('so');

    if (isSalesOrderField) {
      // Try multiple possible sequence number field names
      if (obj.sequenceNumber) {
        return obj.sequenceNumber;
      }
    }

    // Priority 1: Fields ending with "Name" (like customerName, vendorName, etc.)
    const nameFields = keys.filter(key => key.toLowerCase().endsWith('name'));
    if (nameFields.length > 0) {
      // For form dropdown, prioritize formName
      if (fieldName === 'form' && obj.formName) {
        return obj.formName;
      }

      // Prefer entity names over form-related names for other dropdowns
      const entityNameFields = nameFields.filter(field =>
        field.toLowerCase() !== 'name' &&
        (fieldName === 'form' || field.toLowerCase() !== 'formname')
      );

      if (entityNameFields.length > 0) {
        const entityName = entityNameFields.find(field => obj[field]);
        if (entityName) {
          return obj[entityName];
        }
      }

      // Fall back to generic "name" field (but not formName for non-form dropdowns)
      if (obj.name) {
        return obj.name;
      }
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
  // Store credit application data without causing re-renders
  const creditApplicationDataRef = useRef({});
  const lastCreditApplicationDataRef = useRef(null);

  // Memoized callback to prevent infinite loops - receives total amount from SalesItems
  const handleTotalAmountChange = useCallback((totalsData) => {
    // Handle both old format (number) and new format (object) for backward compatibility
    if (typeof totalsData === 'number') {
      setItemsTotalAmount(totalsData);
    } else if (totalsData && typeof totalsData === 'object') {
      // Extract totalAmount from totals object
      setItemsTotalAmount(totalsData.totalAmount || 0);
    }
  }, []);

  // Callback to receive Credit Memo Payment Line data from SalesItems Apply tab
  const handleCreditApplicationChange = useCallback((creditData) => {
    console.log('📋 Credit application data received in SalesForm:', creditData);
    setCreditMemoPaymentLineData(creditData);
  }, []);

  // Credit Memo Payment Line API functions
  const createCreditMemoPaymentLines = useCallback(async (creditMemoId, creditMemoSeqNum, appliedInvoices) => {
    try {
      console.log('🔄 Creating Credit Memo Payment Lines for:', { creditMemoId, creditMemoSeqNum, appliedInvoices });

      // Build all payment line payloads for bulk creation
      const paymentLinesToCreate = appliedInvoices.map((invoice) => {
        const paymentLineData = {
          paymentAmount: invoice.displayAmount || 0,
          recordID: invoice.id,
          isApplied: true,
          refNo: invoice.refNo,
          recordType: invoice.type, // 'Invoice' or 'DebitMemo'
          cmid: creditMemoId,
          creditMemoSeqNum: creditMemoSeqNum,
          mainRecordAmount: invoice.dueAmount || 0
        };

        return cleanPayload(paymentLineData);
      });

      // Send bulk POST request
      const bulkPayload = {
        lines: paymentLinesToCreate
      };

      console.log(`📤 [Credit Memo Payment Lines Bulk Create] Sending ${paymentLinesToCreate.length} lines:`, bulkPayload);

      const response = await fetch(`${apiConfig.baseURL}/credit-memo-payment-line`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(bulkPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to bulk create Credit Memo Payment Lines: ${response.status} - ${errorText}`);
      }

      const createdPaymentLines = await response.json();
      console.log('✅ Credit Memo Payment Lines created successfully in bulk:', createdPaymentLines);
      return createdPaymentLines;
    } catch (error) {
      console.error('❌ Error creating Credit Memo Payment Lines:', error);
      throw error;
    }
  }, []);

  // Update applied record amounts (similar to PaymentForm.js updateRecordAmounts)
  const updateAppliedRecordAmounts = useCallback(async (creditData, modeType) => {
    try {
      const updatePromises = creditData.invoices
        .filter(invoice => invoice.checked)
        .map(async (invoice) => {
          let currentAmountDue = 0;
          let currentAmountPaid = 0;
          let updateUrl;
          let updateData;

          // Determine the API endpoint
          if (invoice.type === 'Invoice') {
            updateUrl = buildUrl(`/invoice/${invoice.id}`);
          } else if (invoice.type === 'DebitMemo') {
            updateUrl = buildUrl(`/debit-memo/${invoice.id}`);
          }

          if (!updateUrl) return;

          // Fetch the current amountDue from the database (to handle concurrency)
          try {
            const fetchResponse = await fetch(updateUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            if (fetchResponse.ok) {
              const currentRecord = await fetchResponse.json();
              currentAmountDue = currentRecord.amountDue || 0;
              currentAmountPaid = currentRecord.amountPaid || 0;
            }
          } catch (error) {
            console.warn(`Failed to fetch current amountDue for ${invoice.type} ${invoice.id}:`, error);
            return; // Skip this invoice if we can't get current data
          }

          // Calculate new amountDue and amountPaid based on mode
          let newAmountDue;
          let newAmountPaid;
          let statusId;

          if (modeType === 'delete') {
            // Delete mode: Revert the credit application (add back the payment amount)
            const paymentAmountToRevert = Math.abs(invoice.displayAmount || 0);
            newAmountDue = currentAmountDue + paymentAmountToRevert;
            newAmountPaid = Math.max(0, currentAmountPaid - paymentAmountToRevert);
            statusId = status['Open']; // Always set to Open when reverting
            console.log(`Delete Mode - ${invoice.type} ${invoice.id}: Current Amount Due: ${currentAmountDue}, Reverting: ${paymentAmountToRevert}, New Amount Due: ${newAmountDue}`);
          } else if (modeType === 'new') {
            // New mode: Apply credit (subtract payment amount)
            newAmountDue = Math.max(0, currentAmountDue - (invoice.displayAmount || 0));
            newAmountPaid = currentAmountPaid + (invoice.displayAmount || 0);
            statusId = newAmountDue === 0 ? status['Closed'] : status['Open'];
            console.log(`New Mode - ${invoice.type} ${invoice.id}: Current Amount Due: ${currentAmountDue}, Applying: ${invoice.displayAmount}, New Amount Due: ${newAmountDue}`);
          } else {
            // Unknown mode
            return;
          }

          updateData = { amountDue: newAmountDue, status: statusId, amountPaid: newAmountPaid };

          const response = await fetch(updateUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(cleanPayload(updateData))
          });

          if (!response.ok) {
            console.warn(`Failed to update ${invoice.type} ${invoice.id}:`, response.status);
          } else {
            console.log(`✅ Updated ${invoice.type} ${invoice.id}: amountDue ${currentAmountDue} → ${newAmountDue}, amountPaid ${currentAmountPaid} → ${newAmountPaid}`);
          }
        });

      await Promise.all(updatePromises);
      console.log('✅ Applied record amounts updated successfully');
    } catch (error) {
      console.error('❌ Error updating applied record amounts:', error);
      // Don't throw - this is not critical for the main flow
    }
  }, []);

  // Delete existing Credit Memo Payment Lines (for edit mode)
  const deleteCreditMemoPaymentLines = useCallback(async (creditMemoId) => {
    try {
      console.log('🗑️ Deleting existing Credit Memo Payment Lines for:', creditMemoId);

      // First get existing payment lines
      const getResponse = await fetch(`${apiConfig.baseURL}/credit-memo-payment-line/by-credit-memo/${creditMemoId}`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (getResponse.ok) {
        const existingPaymentLines = await getResponse.json();
        const paymentLines = Array.isArray(existingPaymentLines) ? existingPaymentLines : existingPaymentLines.lines || existingPaymentLines.results || [];

        if (paymentLines.length > 0) {
          console.log(`🗑️ Found ${paymentLines.length} Credit Memo Payment Lines to delete`);

          // Collect all IDs for bulk delete
          const idsToDelete = paymentLines.map(line => line.id).filter(id => id);

          if (idsToDelete.length > 0) {
            // Send bulk DELETE request
            const bulkDeletePayload = {
              ids: idsToDelete
            };

            console.log(`📤 [Credit Memo Payment Lines Bulk Delete] Sending ${idsToDelete.length} IDs:`, bulkDeletePayload);

            const deleteResponse = await fetch(`${apiConfig.baseURL}/credit-memo-payment-line`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(bulkDeletePayload)
            });

            if (!deleteResponse.ok) {
              const errorText = await deleteResponse.text();
              throw new Error(`Failed to bulk delete Credit Memo Payment Lines: ${deleteResponse.status} - ${errorText}`);
            }

            console.log(`✅ All ${idsToDelete.length} Credit Memo Payment Lines deleted successfully in bulk`);
          }
        } else {
          console.log('ℹ️ No Credit Memo Payment Lines found to delete');
        }
      } else {
        console.log('ℹ️ No existing Credit Memo Payment Lines found or endpoint not accessible');
      }
    } catch (error) {
      console.error('❌ Error deleting Credit Memo Payment Lines:', error);
      throw error; // Throw error to stop deletion process if payment lines can't be deleted
    }
  }, []);

  // Update Credit Memo Transaction Line Items (similar to PaymentForm.js updateTransactionLineItems)
  const updateCreditMemoTransactionLineItems = useCallback(async (paymentLineItems) => {
    try {
      console.log('🔄 Updating Credit Memo Payment Lines for edit mode:', paymentLineItems);

      // Delete existing payment lines first
      await deleteCreditMemoPaymentLines(id);

      // Create new payment lines
      const sequenceNumber = formData.sequenceNumber || '';
      await createCreditMemoPaymentLines(id, sequenceNumber, paymentLineItems);

      console.log('✅ Credit Memo Payment Lines updated successfully');
    } catch (error) {
      console.error('❌ Error updating Credit Memo Payment Lines:', error);
      throw error;
    }
  }, [id, formData.sequenceNumber, deleteCreditMemoPaymentLines, createCreditMemoPaymentLines]);

  // Update Credit Memo Record Amounts for Edit Mode (similar to PaymentForm.js updateRecordAmountsEditMode)
  const updateCreditMemoRecordAmountsEditMode = useCallback(async (paymentData, originalPaymentData) => {
    try {
      console.log('🔄 Updating Credit Memo record amounts in edit mode:', { paymentData, originalPaymentData });
      const updatePromises = [];

      // Update invoices and debit memos - calculate difference from original amounts
      const checkedInvoices = paymentData.invoices?.filter(invoice => invoice.checked) || [];
      for (const invoice of checkedInvoices) {
        // Find original payment line data for this invoice
        const validTypes = ['Invoice', 'DebitMemo'];
        const originalInvoiceLine = originalPaymentData?.lines?.find(line =>
          line.recordID === invoice.id && validTypes.includes(line.recordType)
        );

        const originalPaymentAmount = parseFloat(originalInvoiceLine?.paymentAmount || 0);
        const newPaymentAmount = parseFloat(invoice.displayAmount || 0);
        const paymentDifference = newPaymentAmount - originalPaymentAmount;

        // First, fetch the current amountDue from the database
        let currentAmountDue = 0;
        let currentAmountPaid = 0;
        let apiEndpoint;

        if (invoice.type === 'Invoice') {
          apiEndpoint = buildUrl(`/invoice/${invoice.id}`);
        } else if (invoice.type === 'DebitMemo') {
          apiEndpoint = buildUrl(`/debit-memo/${invoice.id}`);
        }

        if (apiEndpoint) {
          try {
            const fetchResponse = await fetch(apiEndpoint, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            if (fetchResponse.ok) {
              const currentRecord = await fetchResponse.json();
              currentAmountDue = parseFloat(currentRecord.amountDue || 0);
              currentAmountPaid = currentRecord.amountPaid || 0;
            }
          } catch (error) {
            console.warn(`Failed to fetch current amountDue for ${invoice.type} ${invoice.id}:`, error);
            currentAmountDue = parseFloat(invoice.dueAmount || 0); // fallback to displayed amount
          }
        }

        // Calculate new amountDue based on difference using fetched current amount
        const newAmountDue = currentAmountDue - paymentDifference;
        const newAmountPaid = currentAmountPaid + paymentDifference;
        let statusId;
        if (newAmountDue === 0) {
          statusId = status['Closed'];
        } else {
          statusId = status['Open'];
        }

        console.log(`Edit Mode - ${invoice.type} ${invoice.refNo}: Original Payment: ${originalPaymentAmount}, New Payment: ${newPaymentAmount}, Payment Difference: ${paymentDifference}, Fetched Current Amount Due: ${currentAmountDue}, New Amount Due: ${newAmountDue}`);

        let updateData;
        updateData = { amountDue: newAmountDue, status: statusId, amountPaid: newAmountPaid };


        if (updateData && apiEndpoint && paymentDifference !== 0) {
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

      if (updatePromises.length > 0) {
        const responses = await Promise.all(updatePromises);
        const failedUpdates = responses.filter(response => !response.ok);

        if (failedUpdates.length > 0) {
          throw new Error(`Failed to update ${failedUpdates.length} record amounts`);
        }

        console.log('✅ Credit Memo record amounts updated successfully in edit mode');
      }
    } catch (error) {
      console.error('❌ Error updating Credit Memo record amounts in edit mode:', error);
      throw error;
    }
  }, []);

  // Load existing Credit Memo Payment Lines (for edit/view mode)
  const loadCreditMemoPaymentLines = useCallback(async (creditMemoId) => {
    try {
      console.log('📖 Loading existing Credit Memo Payment Lines for:', creditMemoId);

      const response = await fetch(buildUrl(`/credit-memo-payment-line/by-credit-memo/${creditMemoId}`), {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (response.ok) {
        const paymentLinesData = await response.json();
        const paymentLines = Array.isArray(paymentLinesData) ? paymentLinesData : paymentLinesData.lines || paymentLinesData.results || [];

        console.log('📋 Loaded Credit Memo Payment Lines:', paymentLines);
        return paymentLines;
      }

      return [];
    } catch (error) {
      console.error('❌ Error loading Credit Memo Payment Lines:', error);
      return [];
    }
  }, []);

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

        if (fieldName === 'locationID') {
          console.log(`📍 ${fieldName} selected:`, valueToPass);
          setSelectedLocation(valueToPass);
        }
      }
    };
  }, [dropdownData, handleFormSelection, setSelectedLocation]);

  const normalizeMultiSelectValue = useCallback((rawValue) => {
    if (Array.isArray(rawValue)) {
      return rawValue
        .map(item => {
          if (item === null || item === undefined) return null;
          if (typeof item === 'object') {
            if (item.value !== undefined) return item.value;
            if (item.id !== undefined) return item.id;
          }
          return item;
        })
        .filter(value => value !== null && value !== undefined && value !== '');
    }

    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return [];
    }

    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        if (trimmed.includes(',')) {
          return trimmed.split(',').map(value => value.trim()).filter(Boolean);
        }
      }
      return [trimmed];
    }

    return [rawValue];
  }, []);

  const getMultiSelectProps = useCallback((fieldRenderProps) => {
    const { name: fieldName, value, onChange } = fieldRenderProps;
    const fieldData = dropdownData[fieldName] || [];

    const processedData = fieldData.map(item => {
      if (typeof item === 'string') return { text: item, value: item };
      if (!item || typeof item !== 'object') return { text: String(item), value: item };

      const valueFieldValue = item.id ?? item.value ?? item.sequenceNumber ?? JSON.stringify(item);
      const displayText = getDisplayText(item, fieldName) ||
        item.sequenceNumber ||
        item.name ||
        valueFieldValue;

      return { text: displayText, value: valueFieldValue };
    });

    const normalizedValues = normalizeMultiSelectValue(value);
    const selectedFromData = processedData.filter(item => normalizedValues.includes(item.value));
    const unmatchedValues = normalizedValues.filter(val => !processedData.some(item => item.value === val));
    const unmatchedItems = unmatchedValues.map(val => ({ text: val, value: val }));
    const multiSelectValue = [...selectedFromData, ...unmatchedItems];

    return {
      data: processedData,
      textField: 'text',
      valueField: 'value',
      value: multiSelectValue,
      placeholder: '-- Select --',
      tagMode: 'single',
      autoClose: false,
      popupSettings: {
        appendTo: typeof document !== 'undefined' ? document.body : undefined,
        animate: false
      },
      onChange: (event) => {
        const selectedItems = event.target.value || [];
        const nextValues = selectedItems.map(item => (item && item.value !== undefined) ? item.value : item);
        if (onChange) {
          onChange({ target: { value: nextValues } });
        }
      }
    };
  }, [dropdownData, normalizeMultiSelectValue, getDisplayText]);

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

  const renderSingleField = useCallback((field, isCustom, isFullWidth = false, customKey = null, formRenderProps = null) => {
    const fieldName = isCustom ? `custom_${field.fieldName || field.name}` : field.name;
    const fieldId = isCustom ? field.fieldName || field.name : field.name;
    const key = customKey || `${isCustom ? 'custom' : 'standard'}-field-${field.id || fieldId}`;

    // Hide discount field for all record types except Invoice
    if (!isCustom && (field.name === 'discount' || fieldId === 'discount') && recordType !== 'Invoice') {
      return null;
    }

    // Hide totalAmount and status fields (these are calculated/system fields)
    if (!isCustom && (field.name === 'totalAmount' || fieldId === 'totalAmount' || field.name === 'status' || fieldId === 'status')) {
      return null;
    }

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
      const isFullWidth = ['TextArea', 'Checkbox'].includes(field.fieldTypeName);

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

      <div className="master-form-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2>
            {mode === 'new' ? `Create New ${recordType}` :
              mode === 'edit' ? `Edit ${recordType}` : `View ${recordType}`}
          </h2>
          {/* Status badge in header for edit/view mode for SalesOrder and ItemFulfillment */}
          {(mode === 'edit' || mode === 'view') && formData.status && (() => {
            // Get status name from dropdown data
            const statusData = dropdownData.status || [];
            const currentStatus = statusData.find(s => s.id === formData.status);
            const statusName = currentStatus?.name || '';

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
        <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
          {/* Close Button - always at top */}
          <Button
            type="button"
            onClick={() => navigate(navigationPaths[recordType] || '/sales-order')}
            className="k-button k-button-secondary"
          >
            <FaTimes /> {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>

          {/* Edit Button - only for SalesOrder in view mode when status is NOT Closed */}
          {recordType === 'SalesOrder' && mode === 'view' && formData.status !== 'b2dae51c-12b6-4a90-adfd-4e2345026b70' && (
            <Button
              type="button"
              onClick={() => navigate(`${navigationPaths[recordType]}/edit/${id}`)}
              className="k-button k-button-primary"
            >
              <FaPencilAlt /> Edit
            </Button>
          )}

          {/* Fulfill Button - only for SalesOrder in view mode with Fulfillment status */}
          {recordType === 'SalesOrder' && mode === 'view' && formData.status === '5e3f19d1-f615-4954-88cb-30975d52b8cd' && (
            <Button
              type="button"
              onClick={handleFulfill}
              className="k-button k-button-success"
            >
              <FaTruck /> Fulfill
            </Button>
          )}

          {/* Bill Button - only for ItemFulfillment in view mode with Open status */}
          {recordType === 'ItemFulfillment' && mode === 'view' && formData.status === '5e3f19d1-f615-4954-88cb-30975d52b8cd' && (
            <Button
              type="button"
              onClick={handleBill}
              className="k-button k-button-success"
            >
              <FaClipboardList /> Bill
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Total and Amount Due Display - for Invoice, DebitMemo, and CreditMemo */}
      {(recordType === 'Invoice' || recordType === 'DebitMemo' || recordType === 'CreditMemo') && (
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
            minWidth: '280px'
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
                Total
              </div>
              <div style={{
                fontSize: '18px',
                color: '#2c3e50',
                fontWeight: '700',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {Number(formData?.totalAmount || 0).toFixed(2)}
              </div>
            </div>

            {/* Amount Due / UnApplied Section */}
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
                {recordType === 'CreditMemo' ? 'UnApplied' : 'Amount Due'}
              </div>
              <div style={{
                fontSize: '18px',
                color: recordType === 'CreditMemo' ? '#27ae60' : '#e74c3c',
                fontWeight: '700',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {recordType === 'CreditMemo'
                  ? (Number(formData?.unApplied || 0).toFixed(2))
                  : (Number(formData?.amountDue || 0).toFixed(2))
                }
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
          render={(formRenderProps) => {
            // Calculate transaction summary totals from current form items
            const currentItems = formRenderProps.valueGetter('items') || [];
            const resolvedInvoiceFulfillmentId = recordType === 'Invoice'
              ? (mode === 'new'
                ? getItemFulfillmentIdFromGetter(formRenderProps.valueGetter)
                : getItemFulfillmentIdFromObject(formData))
              : null;

            //formRenderProps.valueGetter('grossAmount')
            return (
              <FormElement>
                <div className="master-form-content">
                  {/* Transaction Summary Box - Compact Right Corner - Hide in create mode */}
                  {mode !== 'new' && currentItems.length > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        width: '350px',
                        background: '#ffffff',
                        border: '2px solid #0d6efd',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                      }}>
                        {/* Header */}
                        <div style={{
                          background: 'linear-gradient(135deg, #0d6efd 0%, #0056b3 100%)',
                          padding: '10px 16px',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '14px',
                          textAlign: 'center',
                          letterSpacing: '0.5px'
                        }}>
                          TRANSACTION SUMMARY
                        </div>

                        {/* Content */}
                        <div style={{ padding: '16px' }}>
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '13px'
                          }}>
                            <tbody>
                              <tr>
                                <td style={{
                                  padding: '6px 0',
                                  color: '#666',
                                  fontWeight: '500'
                                }}>
                                  Gross Amount:
                                </td>
                                <td style={{
                                  padding: '6px 0',
                                  textAlign: 'right',
                                  fontWeight: '600',
                                  color: '#212529'
                                }}>
                                  {formRenderProps.valueGetter('grossAmount') || 0}
                                </td>
                              </tr>
                              {recordType === 'Invoice' && (
                                <tr>
                                  <td style={{
                                    padding: '6px 0',
                                    color: '#666',
                                    fontWeight: '500'
                                  }}>
                                    Discount:
                                  </td>
                                  <td style={{
                                    padding: '6px 0',
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    color: '#dc3545'
                                  }}>
                                    {formRenderProps.valueGetter('discount') || 0}
                                  </td>
                                </tr>
                              )}
                              <tr>
                                <td style={{
                                  padding: '6px 0',
                                  color: '#666',
                                  fontWeight: '500'
                                }}>
                                  Subtotal:
                                </td>
                                <td style={{
                                  padding: '6px 0',
                                  textAlign: 'right',
                                  fontWeight: '600',
                                  color: '#212529'
                                }}>
                                  {formRenderProps.valueGetter('subTotal') || 0}
                                </td>
                              </tr>
                              <tr>
                                <td style={{
                                  padding: '6px 0',
                                  color: '#666',
                                  fontWeight: '500',
                                  borderBottom: '1px solid #dee2e6',
                                  paddingBottom: '8px'
                                }}>
                                  Tax Amount:
                                </td>
                                <td style={{
                                  padding: '6px 0',
                                  textAlign: 'right',
                                  fontWeight: '600',
                                  color: '#0066cc',
                                  borderBottom: '1px solid #dee2e6',
                                  paddingBottom: '8px'
                                }}>
                                  {formRenderProps.valueGetter('taxTotal') || 0}
                                </td>
                              </tr>
                              <tr>
                                <td style={{
                                  padding: '10px 0 6px 0',
                                  color: '#212529',
                                  fontWeight: '700',
                                  fontSize: '14px'
                                }}>
                                  Net Total:
                                </td>
                                <td style={{
                                  padding: '10px 0 6px 0',
                                  textAlign: 'right',
                                  fontWeight: '700',
                                  color: '#0d6efd',
                                  fontSize: '16px'
                                }}>
                                  {formRenderProps.valueGetter('netTotal') || 0}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

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

                  {/* Transaction Items Section with CustomerPayment-style Tabs */}
                  <div className="form-section">
                    {/* Tab-based layout for all sales transaction types */}
                    {(recordType === 'SalesOrder' || recordType === 'Invoice' || recordType === 'ItemFulfillment' || recordType === 'CreditMemo' || recordType === 'DebitMemo') ? (
                      <div className="payment-container" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: '0' }}>
                        <style>{`
                        .payment-container { 
                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                          background-color: #fff; 
                          color: #333; 
                        }
                      `}</style>

                        <div className="sales-tabs">
                          <button
                            type="button"
                            className={`sales-tab ${activeTab === 'items' ? 'active' : ''}`}
                            onClick={() => {
                              setActiveTab('items');
                              // Reset SalesItems tab to items when switching to Items tab
                              window.dispatchEvent(new CustomEvent('resetSalesItemsTab'));
                            }}
                          >
                            <FaBoxes /> Items
                          </button>
                          {mode !== 'new' && (recordType === 'Invoice' || recordType === 'DebitMemo') && (
                            <button
                              type="button"
                              className={`sales-tab ${activeTab === 'transactions' ? 'active' : ''}`}
                              onClick={() => {
                                setActiveTab('transactions');
                                // Reset SalesItems tab to items when switching to Payments tab
                                window.dispatchEvent(new CustomEvent('resetSalesItemsTab'));
                              }}
                            >
                              <FaCreditCard /> Payments
                            </button>
                          )}
                          {(recordType === 'Invoice' || recordType === 'DebitMemo' || recordType === 'CreditMemo' || recordType === 'ItemFulfillment') && (mode === 'edit' || mode === 'view') && (
                            <button
                              type="button"
                              className={`sales-tab ${activeTab === 'glimpact' ? 'active' : ''}`}
                              onClick={() => {
                                setActiveTab('glimpact');
                                // Reset SalesItems tab to items when switching to GL Impact
                                window.dispatchEvent(new CustomEvent('resetSalesItemsTab'));
                              }}
                            >
                              <FaChartBar /> GL Impact
                            </button>
                          )}
                        </div>

                        <div className="sales-tab-content">
                          {activeTab === 'items' && (
                            <SalesItems
                              recordType={recordType}
                              mode={mode}
                              embedded={true}
                              onTotalAmountChange={handleTotalAmountChange}
                              headerDiscount={formRenderProps.valueGetter('discount') || 0}
                              selectedLocation={selectedLocation}
                              soid={recordType === 'ItemFulfillment' ? (mode === 'new' ? formRenderProps.valueGetter('salesOrderId') || formRenderProps.valueGetter('soid') || formRenderProps.valueGetter('salesOrder') : formData.soid || formData.salesOrderId) : (mode === 'new' ? id : null)}
                              dnid={recordType === 'Invoice' ? resolvedInvoiceFulfillmentId : null}
                              customerId={recordType === 'CreditMemo' ? (formRenderProps.valueGetter('customerID') || formRenderProps.valueGetter('customer') || formData.customerID) : null}
                              creditMemoTotalAmount={recordType === 'CreditMemo' ? (itemsTotalAmount || formRenderProps.valueGetter('totalAmount') || 0) : 0}
                              onCreditApplicationChange={recordType === 'CreditMemo' ? handleCreditApplicationChange : null}
                              originalRecordLineItems={originalRecordLineItems}
                            />
                          )}

                          {activeTab === 'transactions' && (recordType === 'Invoice' || recordType === 'DebitMemo') && (
                            <TransactionsPanel
                              loading={transactionsLoading}
                              transactions={transactionsData}
                              recordType={recordType}
                              onNavigate={(path) => navigate(path)}
                            />
                          )}

                          {activeTab === 'glimpact' && (recordType === 'Invoice' || recordType === 'DebitMemo' || recordType === 'CreditMemo' || recordType === 'ItemFulfillment') && (mode === 'edit' || mode === 'view') && (
                            <GlImpactPanel
                              loading={glImpactLoading}
                              entries={glImpactData}
                              recordType={recordType}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Regular Items section for non-view modes or other record types */
                      <>
                        <div className="section-header">
                          <h3 className="section-title">Items</h3>
                        </div>
                        <div style={{ padding: '0', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                          <SalesItems
                            recordType={recordType}
                            mode={mode}
                            embedded={true}
                            onTotalAmountChange={handleTotalAmountChange}
                            headerDiscount={formRenderProps.valueGetter('discount') || 0}
                            selectedLocation={selectedLocation}
                            soid={recordType === 'ItemFulfillment' ? (mode === 'new' ? formRenderProps.valueGetter('salesOrderId') || formRenderProps.valueGetter('soid') || formRenderProps.valueGetter('salesOrder') : formData.soid || formData.salesOrderId) : (mode === 'new' ? id : null)}
                            dnid={recordType === 'Invoice' ? resolvedInvoiceFulfillmentId : null}
                            customerId={recordType === 'CreditMemo' ? (formRenderProps.valueGetter('customerID') || formRenderProps.valueGetter('customer') || formData.customerID) : null}
                            creditMemoTotalAmount={recordType === 'CreditMemo' ? (itemsTotalAmount || formRenderProps.valueGetter('totalAmount') || 0) : 0}
                            onCreditApplicationChange={recordType === 'CreditMemo' ? handleCreditApplicationChange : null}
                            originalRecordLineItems={originalRecordLineItems}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="master-form-actions">
                  <Button
                    type="button"
                    onClick={() => navigate(navigationPaths[recordType] || '/sales-order')}
                    className="k-button k-button-secondary"
                  >
                    <FaTimes /> {mode === 'view' ? 'Close' : 'Cancel'}
                  </Button>
                  {mode !== 'new' && formData.status !== status["Closed"] && (
                    <Button
                      type="button"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="k-button k-button-danger"
                    >
                      <FaTrash /> Delete
                    </Button>
                  )}
                  {mode !== 'view' && formData.status !== status["Closed"] && (
                    <Button
                      type="submit"
                      disabled={loading || (() => {
                        // Always allow CreditMemo submission
                        if (recordType === 'CreditMemo') return false;

                        // Allow ItemFulfillment submission when it has pre-populated data from SalesOrder
                        if (recordType === 'ItemFulfillment' && mode === 'new') {
                          const hasSessionData = sessionStorage.getItem('salesOrderDataForFulfillment');
                          if (hasSessionData) return false;
                        }

                        // Allow Invoice submission when it has pre-populated data from ItemFulfillment
                        if (recordType === 'Invoice' && mode === 'new') {
                          const hasSessionData = sessionStorage.getItem('itemFulfillmentDataForBilling');
                          if (hasSessionData) return false;
                        }

                        // Default behavior for other cases
                        return !formRenderProps.allowSubmit;
                      })()}
                      className="k-button k-button-primary"
                      onClick={(e) => {
                        // Force form submission for special cases
                        const shouldForceSubmission = (() => {
                          if (recordType === 'CreditMemo') return true;
                          if (recordType === 'ItemFulfillment' && mode === 'new') {
                            const hasSessionData = sessionStorage.getItem('salesOrderDataForFulfillment');
                            return hasSessionData;
                          }
                          if (recordType === 'Invoice' && mode === 'new') {
                            const hasSessionData = sessionStorage.getItem('itemFulfillmentDataForBilling');
                            return hasSessionData;
                          }
                          return false;
                        })();

                        if (shouldForceSubmission && !formRenderProps.allowSubmit) {
                          e.preventDefault();
                          // Use combinedFormData as fallback if formRenderProps.value is undefined
                          const formData = formRenderProps.value || combinedFormData;
                          handleSubmit(formData);
                        }
                      }}
                    >
                      <FaSave /> {loading ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </div>
              </FormElement>
            );
          }}
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

export const SalesOrderForm = (props) => <SalesForm {...props} recordType="SalesOrder" />;
export const ItemFulfillmentForm = (props) => <SalesForm {...props} recordType="ItemFulfillment" />;
export const InvoiceForm = (props) => <SalesForm {...props} recordType="Invoice" />;

export default SalesForm; 
