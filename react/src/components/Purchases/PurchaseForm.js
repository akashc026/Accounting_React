import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiConfig, buildUrl } from '../../config/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Field, FormElement, FieldArray } from '@progress/kendo-react-form';
import { Input, TextArea, NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import ConfirmDialog from '../shared/ConfirmDialog';
import { FaSave, FaTimes, FaTrash, FaPlus, FaClipboardList, FaExchangeAlt, FaEye, FaTruck, FaBoxes, FaChartBar } from 'react-icons/fa';
import { useDynamicForm } from '../../hooks/useDynamicForm';
import { useMasterData, useVendorCredits, useStatus } from '../../hooks/useMasterData';
import useInventoryDetail from '../../hooks/useInventoryDetail';
import { processJvLines, validateJvAccountsBeforeCreate, generateJvLines } from '../../hooks/useProcessingJvLines';
import { processJournal } from '../../hooks/useJournal';
import PurchaseItems from './PurchaseItems';
import '../../shared/styles/DynamicFormCSS.css';

// Tab styles for Purchase form - compact rectangle tabs
const tabStyles = `
  .purchase-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid #e8eaed;
    margin-bottom: 0;
    background: transparent;
    padding: 0;
  }

  .purchase-tab {
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

  .purchase-tab:hover {
    background: #e8f0fe;
    color: #1a73e8;
  }

  .purchase-tab.active {
    background: white;
    color: #1a73e8;
    border-bottom: 2px solid white;
    margin-bottom: -2px;
    font-weight: 700;
  }

  .purchase-tab svg {
    font-size: 14px;
  }

  .purchase-tab:nth-child(1) svg {
    color: #4285f4;
  }

  .purchase-tab:nth-child(1).active svg {
    color: #4285f4;
  }

  .purchase-tab:nth-child(2) svg {
    color: #ea4335;
  }

  .purchase-tab:nth-child(2).active svg {
    color: #ea4335;
  }

  .purchase-tab:nth-child(3) svg {
    color: #34a853;
  }

  .purchase-tab:nth-child(3).active svg {
    color: #34a853;
  }

  .purchase-tab-content {
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

  .view-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 13px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(26,115,232,0.2);
    border: none;
  }

  .view-link:hover {
    background: linear-gradient(135deg, #1557b0 0%, #1a73e8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(26,115,232,0.3);
    color: white;
    text-decoration: none;
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

  .payment-id {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    background: #f8f9fa;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    color: #5f6368;
    border: 1px solid #e8eaed;
    font-weight: 500;
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
if (typeof document !== 'undefined' && !document.getElementById('purchase-tab-styles')) {
  const style = document.createElement('style');
  style.id = 'purchase-tab-styles';
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

const PurchaseForm = React.memo(({ recordType, mode = 'new' }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { loading: dynamicLoading, error: dynamicError, fetchFormConfiguration } = useDynamicForm();

  // Purchase-specific hooks - all called unconditionally to follow Rules of Hooks
  const purchaseOrdersHook = useMasterData('purchase-order');
  const itemReceiptsHook = useMasterData('item-receipt');
  const vendorBillsHook = useMasterData('vendor-bill');
  const vendorCreditsHook = useVendorCredits();
  const statusHook = useStatus();

  // Inventory management hook for ItemReceipt
  const {
    createOrUpdateInventoryDetail,
    validateInventoryAvailability,
    processItemReceipt,
    checkInventoryDetailExists,
    setInventoryQuantity,
    bulkSetInventoryQuantity,
    bulkProcessItemReceipt
  } = useInventoryDetail();

  // Select the appropriate hook result based on recordType
  const transactionHook = recordType === 'PurchaseOrder' ? purchaseOrdersHook :
    recordType === 'ItemReceipt' ? itemReceiptsHook :
      recordType === 'VendorBill' ? vendorBillsHook :
        recordType === 'VendorCredit' ? vendorCreditsHook :
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
  const [itemsTotalAmount, setItemsTotalAmount] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('items');
  const [glImpactData, setGlImpactData] = useState([]);
  const [glImpactLoading, setGlImpactLoading] = useState(false);
  const [transactionsData, setTransactionsData] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const [vendorCreditPaymentLineData, setVendorCreditPaymentLineData] = useState({
    creditAmount: '',
    vendorBills: [],
    appliedTo: 0,
    unapplied: 0,
    originalData: null
  });

  const [formInitialized, setFormInitialized] = useState(false);

  // Store original record line items for edit mode (to preserve record values when re-adding removed items)
  const [originalRecordLineItems, setOriginalRecordLineItems] = useState([]);

  // POID change detection state
  const [currentPoid, setCurrentPoid] = useState(null);
  const [poidChangeCounter, setPoidChangeCounter] = useState(0);

  // Refs for cleanup
  const notificationTimerRef = React.useRef(null);
  const originalFormData = React.useRef(null);

  // Transaction form navigation - simplified for purchase orders, item receipts, vendor bills, and vendor credits
  const navigationPaths = {
    PurchaseOrder: '/purchase-order',
    ItemReceipt: '/item-receipt',
    VendorBill: '/vendor-bill',
    VendorCredit: '/vendor-credit'
  };

  const status = {
    "Closed": "b2dae51c-12b6-4a90-adfd-4e2345026b70",
    "Open": "5e3f19d1-f615-4954-88cb-30975d52b8cd"
  }

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

  // Fetch transactions data for vendor payment lines and vendor credit payment lines
  const fetchTransactionsData = useCallback(async (recordId) => {
    if (!recordId || recordType !== 'VendorBill') {
      return [];
    }

    setTransactionsLoading(true);
    try {
      // Fetch both vendor payment lines and vendor credit payment lines in parallel
      const [vendorPaymentResponse, vendorCreditPaymentResponse] = await Promise.all([
        fetch(`${apiConfig.baseURL}/vendor-payment-line/by-record-id/${recordId}`, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        }),
        fetch(`${apiConfig.baseURL}/vendor-credit-payment-line/by-record-id/${recordId}`, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        })
      ]);

      // Process vendor payment lines
      let vendorPaymentData = [];
      if (vendorPaymentResponse.ok) {
        const paymentData = await vendorPaymentResponse.json();
        vendorPaymentData = Array.isArray(paymentData) ? paymentData.map(item => ({
          ...item,
          transactionType: 'Vendor Payment'
        })) : [];
      } else if (vendorPaymentResponse.status !== 404) {
        console.warn(`Failed to fetch vendor payment lines: ${vendorPaymentResponse.status}`);
      }

      // Process vendor credit payment lines
      let vendorCreditPaymentData = [];
      if (vendorCreditPaymentResponse.ok) {
        const creditData = await vendorCreditPaymentResponse.json();
        vendorCreditPaymentData = Array.isArray(creditData) ? creditData.map(item => ({
          ...item,
          transactionType: 'Vendor Credit'
        })) : [];
      } else if (vendorCreditPaymentResponse.status !== 404) {
        console.warn(`Failed to fetch vendor credit payment lines: ${vendorCreditPaymentResponse.status}`);
      }

      // Combine both types of transactions
      const allTransactions = [...vendorPaymentData, ...vendorCreditPaymentData];

      // Sort by date if available, or by ID
      allTransactions.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return (b.id || 0) - (a.id || 0);
      });

      return allTransactions;
    } catch (err) {
      console.error('Error fetching transactions data:', err);
      return [];
    } finally {
      setTransactionsLoading(false);
    }
  }, [recordType]);

  // Fetch GL Impact data for the current record
  const fetchGLImpactData = useCallback(async (recordId) => {
    if (!recordId || recordType === 'PurchaseOrder') {
      return [];
    }

    try {
      setGlImpactLoading(true);
      const response = await fetch(`${apiConfig.baseURL}/journal-entry-line/by-record-id/${recordId}`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (response.ok) {
        const glData = await response.json();
        return Array.isArray(glData) ? glData : [];
      }
      return [];
    } catch (err) {
      console.error('Error fetching GL Impact data:', err);
      return [];
    } finally {
      setGlImpactLoading(false);
    }
  }, [recordType]);

  // Render transactions table
  const renderTransactionsTable = () => {
    if (transactionsLoading) {
      return (
        <div className="transactions-section">
          <div className="loading-transactions">
            <div className="spinner"></div>
            Loading payment transactions...
          </div>
        </div>
      );
    }

    if (!transactionsData || transactionsData.length === 0) {
      return (
        <div className="transactions-section">
          <div className="no-transactions">
            <FaExchangeAlt />
            No payment transactions found for this {recordType.toLowerCase()}.
          </div>
        </div>
      );
    }

    return (
      <div className="transactions-section">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Type</th>
              <th>Reference</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactionsData.map((transaction, index) => (
              <tr key={transaction.id || index}>
                <td>
                  {transaction.transactionType === 'Vendor Payment' && (
                    <button
                      className="view-button"
                      onClick={() => navigate(`/vendor-payment/view/${transaction.paymentId}`)}
                    >
                      <FaEye /> View
                    </button>
                  )}
                  {transaction.transactionType === 'Vendor Credit' && (
                    <button
                      className="view-button"
                      onClick={() => navigate(`/vendor-credit/view/${transaction.paymentId || transaction.vcid}`)}
                    >
                      <FaEye /> View
                    </button>
                  )}
                </td>
                <td>{transaction.transactionType || 'Unknown'}</td>
                <td>{transaction.paymentSeqNum || transaction.vendorCreditSeqNum || 'N/A'}</td>
                <td>{(transaction.paymentAmount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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

          // Check for PurchaseOrder data for ItemReceipt receiving
          if (recordType === 'ItemReceipt') {
            const purchaseOrderDataString = sessionStorage.getItem('purchaseOrderDataForReceiving');
            if (purchaseOrderDataString) {
              try {
                const purchaseOrderData = JSON.parse(purchaseOrderDataString);

                if (purchaseOrderData.form) {
                  initialFormData.form = purchaseOrderData.form;
                  // Generate sequence number immediately for receive scenario
                  try {
                    const [formResponse, sequenceResponse] = await Promise.all([
                      fetch(`${apiConfig.baseURL}/form/${purchaseOrderData.form}`, {
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                      }),
                      fetch(`${apiConfig.baseURL}/form-sequence/by-form/${purchaseOrderData.form}`, {
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
                  }

                  handleFormSelection(purchaseOrderData.form);
                }

                // Populate ItemReceipt form with PurchaseOrder data
                if (purchaseOrderData.poid) {
                  initialFormData.poid = purchaseOrderData.poid;
                }

                if (purchaseOrderData.vendorID) {
                  initialFormData.vendorID = purchaseOrderData.vendorID;
                }
                if (purchaseOrderData.locationID) {
                  initialFormData.locationID = purchaseOrderData.locationID;
                  setSelectedLocation(purchaseOrderData.locationID);
                }
                if (purchaseOrderData.deliveryDate) {
                  initialFormData.deliveryDate = new Date(purchaseOrderData.deliveryDate);
                }
                if (purchaseOrderData.discount) {
                  initialFormData.discount = purchaseOrderData.discount;
                }
                if (purchaseOrderData.totalAmount) {
                  initialFormData.totalAmount = purchaseOrderData.totalAmount;
                }

                // Set items data for receiving
                // Handle both direct array and API response structure (items.results)
                const itemsArray = purchaseOrderData.items?.results || purchaseOrderData.items || [];
                if (itemsArray && itemsArray.length > 0) {
                  initialFormData.items = itemsArray.map(item => {
                    const remainingQty = item.quantity - (item.receivedQty || 0);
                    const lineAmount = remainingQty * (item.rate || 0);
                    const taxAmount = lineAmount * ((item.taxPercent || 0) / 100);
                    const totalAmount = lineAmount + taxAmount;

                    return {
                      ...item,
                      // For ItemReceipt, quantity becomes quantityReceived
                      quantityReceived: remainingQty,
                      quantity: item.quantity || 0,
                      // Recalculate amounts for remaining quantity
                      taxAmount: taxAmount,
                      totalAmount: totalAmount
                    };
                  });
                }

                // Note: Keep sessionStorage until successful form submission

              } catch (error) {
                // Only clear sessionStorage on error to prevent data loss
                sessionStorage.removeItem('purchaseOrderDataForReceiving');
              }
            }
          }

          // Check for ItemReceipt data for VendorBill billing
          if (recordType === 'VendorBill') {
            const itemReceiptDataString = sessionStorage.getItem('itemReceiptDataForBilling');
            if (itemReceiptDataString) {
              try {
                const itemReceiptData = JSON.parse(itemReceiptDataString);
                if (itemReceiptData.form) {
                  initialFormData.form = itemReceiptData.form;
                  // Generate sequence number immediately for bill scenario
                  try {
                    const [formResponse, sequenceResponse] = await Promise.all([
                      fetch(`${apiConfig.baseURL}/form/${itemReceiptData.form}`, {
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                      }),
                      fetch(`${apiConfig.baseURL}/form-sequence/by-form/${itemReceiptData.form}`, {
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

                  handleFormSelection(itemReceiptData.form);
                }

                // Populate VendorBill form with ItemReceipt data
                if (itemReceiptData.irid) {
                  initialFormData.irid = itemReceiptData.irid;
                }
                if (itemReceiptData.vendorID) {
                  initialFormData.vendorID = itemReceiptData.vendorID;
                }
                if (itemReceiptData.locationID) {
                  initialFormData.locationID = itemReceiptData.locationID;
                  setSelectedLocation(itemReceiptData.locationID);
                }
                if (itemReceiptData.deliveryDate) {
                  initialFormData.invoiceDate = new Date(itemReceiptData.deliveryDate);
                }
                if (itemReceiptData.discount) {
                  initialFormData.discount = itemReceiptData.discount;
                }
                if (itemReceiptData.totalAmount) {
                  initialFormData.totalAmount = itemReceiptData.totalAmount;
                }

                // Set items data for billing
                const itemsArray = itemReceiptData.items?.results || itemReceiptData.items || [];
                if (itemsArray && itemsArray.length > 0) {
                  console.log('[PurchaseForm] Setting items from sessionStorage for VendorBill:', itemsArray);
                  initialFormData.items = itemsArray.map(item => ({
                    ...item,
                    // For VendorBill, quantity becomes quantity (not quantitydelivered)
                    quantity: item.quantity || item.quantitydelivered || 0
                  }));
                }

                // Note: sessionStorage is cleared after successful form submission to allow button enabling logic
              } catch (error) {
                console.error('Error parsing ItemReceipt data for billing:', error);
                sessionStorage.removeItem('itemReceiptDataForBilling');
              }
            }
          }
        }

        if (mode !== 'new' && id) {
          // Fetch existing transaction record
          try {
            let record;

            switch (recordType) {
              case 'PurchaseOrder':
                if (transactionHook?.fetchPurchaseOrderById) {
                  record = await transactionHook.fetchPurchaseOrderById(id);
                }
                break;

              case 'ItemReceipt':
                if (transactionHook?.fetchItemReceiptById) {
                  record = await transactionHook.fetchItemReceiptById(id);
                }
                break;

              case 'VendorBill':
                if (transactionHook?.fetchVendorBillById) {
                  record = await transactionHook.fetchVendorBillById(id);
                }
                break;

              case 'VendorCredit':
                if (transactionHook?.fetchVendorCreditById) {
                  record = await transactionHook.fetchVendorCreditById(id);
                }
                break;

              default:
                record = {};
            }

            if (!isMounted) return;

            // Handle the record data structure
            const recordData = record?.data || record || {};

            console.log('[PurchaseForm] Loaded record data for', recordType, ':', recordData);

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

              console.log('[PurchaseForm] MergedData after processing for', recordType, ':', mergedData);
              console.log('[PurchaseForm] poid field:', mergedData.poid, 'purchaseOrderId field:', mergedData.purchaseOrderId);

              if (mergedData.locationID) {
                setSelectedLocation(mergedData.locationID);
              }

              // Step 2: Load transaction line items (following FormCreator.js pattern)
              try {
                let lineItems = [];
                let lineItemsEndpoint = '';
                let lineItemsIdField = '';

                switch (recordType) {
                  case 'PurchaseOrder':
                    lineItemsEndpoint = `${apiConfig.baseURL}/purchase-order-line/by-purchase-order/${id}`;
                    lineItemsIdField = 'poid';
                    break;

                  case 'ItemReceipt':
                    lineItemsEndpoint = `${apiConfig.baseURL}/item-receipt-line/by-item-receipt/${id}`;
                    lineItemsIdField = 'irid';
                    break;

                  case 'VendorBill':
                    lineItemsEndpoint = `${apiConfig.baseURL}/vendor-bill-line/by-vendor-bill/${id}`;
                    lineItemsIdField = 'vbid';
                    break;

                  case 'VendorCredit':
                    lineItemsEndpoint = `${apiConfig.baseURL}/vendor-credit-line/by-vendor-credit/${id}`;
                    lineItemsIdField = 'vcid';
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
                    } else if (lineItemsData.purchaseOrderLines && Array.isArray(lineItemsData.purchaseOrderLines)) {
                      lineItems = lineItemsData.purchaseOrderLines;
                    } else if (lineItemsData.lines && Array.isArray(lineItemsData.lines)) {
                      lineItems = lineItemsData.lines;
                    } else {
                      // If response is an object with line items as properties, extract them
                      const possibleArrays = Object.values(lineItemsData).filter(value => Array.isArray(value));
                      if (possibleArrays.length > 0) {
                        lineItems = possibleArrays[0]; // Take the first array found
                      }
                    }


                    // Add line items to form data so PurchaseItems component can display them
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
                      }

                      // Calculate amounts for each line item (since API might not have correct totals)
                      const processedLineItems = lineItems.map(item => {
                        const quantity = parseFloat(item.quantity || 0);
                        const rate = parseFloat(item.rate || 0);
                        const discountAmount = parseFloat(item.discountAmount || item.discount || 0);

                        // Get tax percentage from tax data based on taxID
                        let taxPercent = parseFloat(item.taxPercent || 0);
                        if (taxPercent === 0 && item.taxID && taxData.length > 0) {
                          const taxRecord = taxData.find(tax => tax.id === item.taxID);
                          if (taxRecord) {
                            // Try different possible field names for tax percentage
                            taxPercent = parseFloat(taxRecord.taxPercent || taxRecord.percentage || taxRecord.rate || 0);
                          }
                        }

                        // Calculate total amount: (quantity * rate - discount) + tax
                        const subtotal = quantity * rate - discountAmount;
                        const taxAmount = subtotal * taxPercent / 100;
                        const totalAmount = subtotal + taxAmount;

                        const processedItem = {
                          ...item,
                          quantity: quantity,
                          rate,
                          discountAmount,
                          taxPercent, // Use the calculated tax percentage
                          taxAmount: recordType === 'VendorBill' ? taxAmount : (item.taxAmount || taxAmount),
                          taxRate: recordType === 'VendorBill' ? (item.taxRate || taxAmount) : item.taxRate,
                          totalAmount,
                          amount: totalAmount // Also set amount field for compatibility
                        };

                        // For ItemReceipt, ensure quantityReceived and remQty fields are properly set
                        if (recordType === 'ItemReceipt') {
                          processedItem.quantityReceived = item.quantityReceived || item.quantity || 0;

                          // Calculate remQty (remaining quantity) from the original purchase order
                          // This should be the ordered quantity minus what was already received
                          if (item.poid) {
                            // If we have purchase order reference, calculate remaining from PO data
                            processedItem.remQty = (item.quantity || 0) - (processedItem.quantityReceived || 0);
                          } else {
                            // Fallback: use existing remQty or calculate from item data
                            processedItem.remQty = item.remQty || ((item.quantity || 0) - (processedItem.quantityReceived || 0));
                          }
                        }

                        return processedItem;
                      });

                      mergedData.items = processedLineItems;
                      setFormData({ ...mergedData });

                      // Store original form data for quantity tracking
                      originalFormData.current = { ...mergedData };

                      // Store original line items for edit mode (to preserve values when re-adding)
                      if (mode === 'edit' || mode === 'view') {
                        setOriginalRecordLineItems(processedLineItems);
                        console.log('[PurchaseForm] Stored original record line items for edit mode:', processedLineItems);
                      }

                    }
                  } else {
                  }
                }
              } catch (lineItemsError) {
                // Don't throw - line items loading is not critical for form display
              }

              // Load transactions data for VendorBill and VendorCredit in view mode
              if (mode === 'view' && ['VendorBill', 'VendorCredit'].includes(recordType)) {
                try {
                  const transactions = await fetchTransactionsData(id);
                  if (!isMounted) return;
                  setTransactionsData(transactions);
                } catch (transactionError) {
                  // Don't throw - transactions loading is not critical for form display
                }
              }

              // Load GL Impact data for edit and view modes (skip for PurchaseOrder)
              if ((mode === 'edit' || mode === 'view') && recordType !== 'PurchaseOrder') {
                try {
                  const glData = await fetchGLImpactData(id);
                  if (!isMounted) return;
                  setGlImpactData(glData);
                } catch (glError) {
                  console.error('Error loading GL Impact data:', glError);
                  // Don't throw - GL Impact loading is not critical for form display
                }
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
  }, [mode, id, recordType, statusHook.data]); // Only stable dependencies

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
        currentPath.includes('/item-receipt/new') ||
        currentPath.includes('/vendor-bill/new');

      if (!isOnExpectedTarget) {
        sessionStorage.removeItem('purchaseOrderDataForReceiving');
        sessionStorage.removeItem('itemReceiptDataForBilling');
      }
    };
  }, []); // Only run on mount/unmount

  // Add page visibility and beforeunload listeners to clear session on navigation/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear sessionStorage when page is refreshed or browser is closed
      sessionStorage.removeItem('purchaseOrderDataForReceiving');
      sessionStorage.removeItem('itemReceiptDataForBilling');
    };

    const handleVisibilityChange = () => {
      // Clear sessionStorage when user navigates away (page becomes hidden)
      if (document.hidden) {
        // Small delay to allow for normal navigation flow completion
        setTimeout(() => {
          const currentPath = window.location.pathname;
          const isOnExpectedTarget =
            currentPath.includes('/item-receipt/new') ||
            currentPath.includes('/vendor-bill/new');

          if (!isOnExpectedTarget) {
            sessionStorage.removeItem('purchaseOrderDataForReceiving');
            sessionStorage.removeItem('itemReceiptDataForBilling');
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
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  }, []);

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

  const handleReceive = async () => {
    try {
      // Get default form for ItemReceipt
      const defaultFormId = await getDefaultFormForRecordType('ItemReceipt');

      // Get all purchase order lines directly (not using unreceived API to handle duplicates correctly)
      const poLinesUrl = `${apiConfig.baseURL}/purchase-order-line/by-purchase-order/${id}`;
      console.log('🟡 Making API call to:', poLinesUrl);

      const response = await fetch(poLinesUrl, {
        method: 'GET',
        headers: apiConfig.headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch purchase order lines');
      }

      const responseData = await response.json();
      const allPurchaseOrderLines = Array.isArray(responseData) ? responseData :
        (responseData.results || Object.values(responseData).find(v => Array.isArray(v)) || []);
      console.log('🟢 All purchase order lines received:', allPurchaseOrderLines);

      // Filter to only unreceived items (where remaining quantity > 0) and calculate remaining qty per line
      const unreceivedItems = allPurchaseOrderLines
        .map(item => {
          const orderedQty = Number(item.quantity || 0);
          const receivedQty = Number(item.receivedQty || 0);
          const remainingQty = orderedQty - receivedQty;

          // Recalculate amounts based on remaining quantity
          const rate = parseFloat(item.rate || 0);
          const taxPercent = parseFloat(item.taxPercent || 0);
          const lineTotal = remainingQty * rate;
          const taxAmount = Math.round(lineTotal * taxPercent / 100 * 100) / 100;
          const totalAmount = Math.round((lineTotal + taxAmount) * 100) / 100;

          return {
            ...item,
            remainingQty: remainingQty,
            quantity: remainingQty,  // Set quantity to remaining for receiving
            taxAmount: taxAmount,  // Recalculated tax amount
            totalAmount: totalAmount  // Recalculated total amount
          };
        })
        .filter(item => item.remainingQty > 0);  // Only include items with remaining quantity

      console.log('🟢 Unreceived items with correct remaining qty:', unreceivedItems);

      // Process items to add parent line tracking and tempId for client-side uniqueness
      const processedItems = (unreceivedItems || []).map(item => ({
        ...item,
        purchaseOrderLineId: item.id,  // Parent PO line ID for tracking
        tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Client-side unique ID
        quantity: item.quantity || 0,  // Remaining unreceived quantity (already calculated above)
        quantityReceived: item.quantity || 0  // For ItemReceipt
      }));

      console.log('🟢 Processed items with parent tracking:', processedItems);

      // Navigate to ItemReceipt new form with PurchaseOrder data
      const purchaseOrderData = {
        poid: id,
        vendorID: formData.vendorID,
        locationID: formData.locationID,
        poDate: formData.poDate,
        deliveryDate: formData.deliveryDate,
        discount: formData.discount,
        totalAmount: formData.totalAmount,
        items: processedItems,
        form: defaultFormId
      };

      // Store the purchase order data in sessionStorage to pass to ItemReceipt form
      sessionStorage.setItem('purchaseOrderDataForReceiving', JSON.stringify(purchaseOrderData));

      // Navigate to ItemReceipt new form
      navigate('/item-receipt/new');
    } catch (error) {
      // Fallback to using existing formData.items if API call fails
      // Get default form for ItemReceipt (fallback)
      const defaultFormId = await getDefaultFormForRecordType('ItemReceipt');

      // Process fallback items with parent line tracking
      const processedFallbackItems = (formData.items || []).map(item => ({
        ...item,
        purchaseOrderLineId: item.id,  // Parent PO line ID for tracking
        tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Client-side unique ID
        quantity: item.quantity || 0,
        quantityReceived: item.quantity || 0
      }));

      const purchaseOrderData = {
        poid: id,
        vendorID: formData.vendorID,
        locationID: formData.locationID,
        poDate: formData.poDate,
        deliveryDate: formData.deliveryDate,
        discount: formData.discount,
        totalAmount: formData.totalAmount,
        items: processedFallbackItems,
        form: defaultFormId
      };

      sessionStorage.setItem('purchaseOrderDataForReceiving', JSON.stringify(purchaseOrderData));
      navigate('/item-receipt/new');
    }
  };

  const handleBill = async () => {
    try {
      // Get default form for VendorBill
      const defaultFormId = await getDefaultFormForRecordType('VendorBill');

      // Get all item receipt lines directly (not using uninvoiced API to handle duplicates correctly)
      const irLinesUrl = `${apiConfig.baseURL}/item-receipt-line/by-item-receipt/${id}`;
      console.log('🟡 Making API call to:', irLinesUrl);

      const response = await fetch(irLinesUrl, {
        method: 'GET',
        headers: apiConfig.headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch item receipt lines');
      }

      const responseData = await response.json();
      const allItemReceiptLines = Array.isArray(responseData) ? responseData :
        (responseData.lines || responseData.results || Object.values(responseData).find(v => Array.isArray(v)) || []);
      console.log('🟢 All item receipt lines received:', allItemReceiptLines);

      // Filter to only unbilled items (where remaining quantity > 0) and calculate remaining qty per line
      const processedItems = allItemReceiptLines
        .map(item => {
          const receivedQty = parseFloat(item.quantity || 0);
          const invoicedQty = parseFloat(item.invoicedQty || 0);
          const remainingQty = receivedQty - invoicedQty;
          const isTaxApplied = Number(item.taxPercent) > 0;

          console.log(`Item ${item.itemID} (line ${item.id}): received=${receivedQty}, invoiced=${invoicedQty}, remaining=${remainingQty}`);

          // Recalculate amounts based on remaining quantity
          const rate = parseFloat(item.rate || 0);
          const taxPercent = parseFloat(item.taxPercent || 0);
          const lineTotal = remainingQty * rate;
          const taxAmount = Math.round(lineTotal * taxPercent / 100 * 100) / 100;
          const totalAmount = Math.round((lineTotal + taxAmount) * 100) / 100;

          return {
            ...item,
            itemReceiptLineId: item.id,  // Parent IR line ID for tracking
            purchaseOrderLineId: item.purchaseOrderLineId || item.poid,  // Original PO line ID (if available)
            tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Client-side unique ID
            quantity: remainingQty,  // Remaining unbilled quantity
            originalQuantity: receivedQty,
            invoicedQty: invoicedQty,
            taxAmount: taxAmount,  // Recalculated tax amount
            totalAmount: totalAmount,  // Recalculated total amount
            isTaxApplied: isTaxApplied
          };
        })
        .filter(item => item.quantity > 0);  // Only include items with remaining quantity

      console.log('🟢 Unbilled items with correct remaining qty:', processedItems);

      console.log('🟢 Processed vendor bill items with parent tracking:', processedItems);

      // Navigate to VendorBill new form with ItemReceipt data
      const itemReceiptData = {
        irid: id,
        vendorID: formData.vendorID,
        locationID: formData.locationID,
        deliveryDate: formData.deliveryDate,
        discount: formData.discount,
        totalAmount: formData.totalAmount,
        items: processedItems,
        form: defaultFormId
      };

      // Store the item receipt data in sessionStorage to pass to VendorBill form
      sessionStorage.setItem('itemReceiptDataForBilling', JSON.stringify(itemReceiptData));

      // Navigate to VendorBill new form
      navigate('/vendor-bill/new');
    } catch (error) {
      console.error('Error fetching unbilled items:', error);
      // Fallback to using existing formData.items if API call fails
      // Get default form for VendorBill (fallback)
      const defaultFormId = await getDefaultFormForRecordType('VendorBill');

      // Process fallback items with parent line tracking
      const processedFallbackItems = formData.items?.map(item => ({
        ...item,
        itemReceiptLineId: item.id,  // Parent IR line ID for tracking
        purchaseOrderLineId: item.purchaseOrderLineId || item.poid,  // Original PO line ID
        tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Client-side unique ID
        // For VendorBill, use quantity instead of quantitydelivered
        quantity: item.quantitydelivered || item.quantity || 0
      })) || [];

      const itemReceiptData = {
        irid: id,
        vendorID: formData.vendorID,
        locationID: formData.locationID,
        deliveryDate: formData.deliveryDate,
        discount: formData.discount,
        totalAmount: formData.totalAmount,
        items: processedFallbackItems,
        form: defaultFormId
      };

      sessionStorage.setItem('itemReceiptDataForBilling', JSON.stringify(itemReceiptData));
      navigate('/vendor-bill/new');
    }
  };

  // VendorCredit payment line change handler
  const handleVendorCreditApplicationChange = useCallback((creditData) => {
    setVendorCreditPaymentLineData(creditData);
  }, []);

  // Create VendorCredit payment lines (equivalent to createCreditMemoPaymentLines)
  const createVendorCreditPaymentLines = useCallback(async (vendorCreditId, vendorCreditSeqNum, appliedVendorBills) => {
    try {
      console.log('🔄 Creating Vendor Credit Payment Lines for:', { vendorCreditId, vendorCreditSeqNum, appliedVendorBills });

      const paymentLinesToCreate = appliedVendorBills.map((vendorBill) => {
        const paymentLineData = {
          paymentAmount: vendorBill.displayAmount || 0,
          recordID: vendorBill.id,
          isApplied: true,
          refNo: vendorBill.refNo,
          recordType: 'VendorBill',
          vcid: vendorCreditId,
          vendorCreditSeqNum: vendorCreditSeqNum,
          mainRecordAmount: vendorBill.dueAmount || 0
        };

        return cleanPayload(paymentLineData);
      });

      // Execute bulk POST if there are payment lines to create
      if (paymentLinesToCreate.length > 0) {
        const bulkCreatePayload = {
          lines: paymentLinesToCreate
        };

        console.log(`📤 [VendorCreditPaymentLine Bulk Create] Sending ${paymentLinesToCreate.length} lines:`, bulkCreatePayload);

        const bulkCreateResponse = await fetch(`${apiConfig.baseURL}/vendor-credit-payment-line`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(bulkCreatePayload)
        });

        if (!bulkCreateResponse.ok) {
          const errorText = await bulkCreateResponse.text();
          throw new Error(`Failed to bulk create Vendor Credit Payment Lines: ${bulkCreateResponse.status} - ${errorText}`);
        }

        const result = await bulkCreateResponse.json();
        console.log('✅ Vendor Credit Payment Lines created successfully via bulk API');
        return result;
      }
    } catch (error) {
      console.error('❌ Error creating Vendor Credit Payment Lines:', error);
      throw error;
    }
  }, []);

  // Update applied record amounts (equivalent to updateAppliedRecordAmounts)
  const updateAppliedVendorBillAmounts = useCallback(async (creditData, modeType) => {
    try {
      console.log('🔄 Updating applied vendor bill amounts.7897889778', creditData, modeType);
      const updatePromises = creditData.vendorBills
        .filter(vendorBill => vendorBill.checked || vendorBill.isApplied)
        .map(async (vendorBill) => {
          let currentAmountDue = 0;
          let currentAmountPaid = 0;
          let updateUrl;
          let updateData;

          let vbid;
          if (vendorBill.isApplied) {
            vbid = vendorBill.recordID;
          }
          else {
            vbid = vendorBill.id;
          }

          console.log('🔄 Updating applied vendor bill amounts.', vendorBill);
          updateUrl = `${apiConfig.baseURL}/vendor-bill/${vbid}`;

          // Get current record to find current amountDue
          const getResponse = await fetch(updateUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
          });

          console.log('🔄 Get response:', getResponse);
          if (getResponse.ok) {
            const currentRecord = await getResponse.json();
            console.log('🔄 Current record:', currentRecord);
            currentAmountDue = currentRecord.amountDue || 0;
            currentAmountPaid = currentRecord.amountPaid || 0;
          }

          // Calculate new amount due based on mode
          let newAmountDue;
          let newAmountPaid;
          if (modeType === 'new') {
            newAmountDue = Math.max(0, currentAmountDue - (vendorBill.displayAmount || 0));
            newAmountPaid = currentAmountPaid + vendorBill.displayAmount
          } else if (modeType === 'edit') {
            // For edit mode, we need to handle the difference
            const originalAmount = vendorBill.originalAmount || 0;
            const currentAmount = vendorBill.displayAmount || 0;
            const amountDifference = currentAmount - originalAmount;
            newAmountDue = Math.max(0, currentAmountDue - amountDifference);
            newAmountPaid = currentAmountPaid + amountDifference
          } else if (modeType === 'delete') {
            newAmountDue = currentAmountDue + (vendorBill.displayAmount || vendorBill.paymentAmount || 0);
            newAmountPaid = currentAmountPaid - (vendorBill.displayAmount || vendorBill.paymentAmount || 0);
          }

          // Determine status based on amountDue and modeType (similar to SalesForm.js logic)
          let statusId;
          if (modeType === 'delete') {
            statusId = status['Open'];
          } else if (modeType === 'new' || modeType === 'edit') {
            if (newAmountDue === 0) {
              statusId = status['Closed'];
            } else {
              statusId = status['Open'];
            }
          }

          updateData = { amountDue: newAmountDue, status: statusId, amountPaid: newAmountPaid };


          if (updateUrl && updateData) {
            const updateResponse = await fetch(updateUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(cleanPayload(updateData))
            });

            if (!updateResponse.ok) {
              console.error(`Failed to update ${vendorBill.type} ${vendorBill.id}: ${updateResponse.status}`);
            } else {
              console.log(`✅ Updated ${vendorBill.type} ${vendorBill.id} amountDue: ${currentAmountDue} → ${updateData.amountDue}`);
            }
          }
        });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('❌ Error updating applied vendor bill amounts:', error);
      throw error;
    }
  }, []);

  // Delete VendorCredit payment lines (equivalent to deleteCreditMemoPaymentLines)
  const deleteVendorCreditPaymentLines = useCallback(async (vendorCreditId) => {
    try {
      console.log('🗑️ Deleting existing Vendor Credit Payment Lines for:', vendorCreditId);

      // First, get existing payment lines
      const getResponse = await fetch(`${apiConfig.baseURL}/vendor-credit-payment-line/by-vendor-credit/${vendorCreditId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (getResponse.ok) {
        const existingPaymentLines = await getResponse.json();
        const paymentLinesArray = (existingPaymentLines.lines || []);

        if (paymentLinesArray.length > 0) {
          const idsToDelete = paymentLinesArray.map(line => line.id).filter(id => id);

          if (idsToDelete.length > 0) {
            const bulkDeletePayload = {
              ids: idsToDelete
            };

            console.log(`📤 [VendorCreditPaymentLine Bulk Delete] Sending ${idsToDelete.length} IDs:`, bulkDeletePayload);

            const bulkDeleteResponse = await fetch(`${apiConfig.baseURL}/vendor-credit-payment-line`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(bulkDeletePayload)
            });

            if (!bulkDeleteResponse.ok) {
              const errorText = await bulkDeleteResponse.text();
              console.error(`Failed to bulk delete Vendor Credit Payment Lines: ${bulkDeleteResponse.status} - ${errorText}`);
            } else {
              console.log('✅ All existing Vendor Credit Payment Lines deleted via bulk API');
            }
          }
        }
      } else if (getResponse.status !== 404) {
        console.warn(`Failed to fetch existing payment lines: ${getResponse.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting Vendor Credit Payment Lines:', error);
      throw error;
    }
  }, []);

  // Update VendorCredit transaction line items (equivalent to updateCreditMemoTransactionLineItems)
  const updateVendorCreditTransactionLineItems = useCallback(async (paymentLineItems) => {
    try {
      console.log('🔄 Updating Vendor Credit transaction line items');

      // Delete existing payment lines first
      await deleteVendorCreditPaymentLines(id);

      // Create new payment lines
      const sequenceNumber = formData.sequenceNumber || '';
      await createVendorCreditPaymentLines(id, sequenceNumber, paymentLineItems);

      console.log('✅ Vendor Credit transaction line items updated successfully');
    } catch (error) {
      console.error('❌ Error updating Vendor Credit transaction line items:', error);
      throw error;
    }
  }, [id, formData.sequenceNumber, deleteVendorCreditPaymentLines, createVendorCreditPaymentLines]);

  // Update VendorCredit record amounts in edit mode (equivalent to updateCreditMemoRecordAmountsEditMode)
  const updateVendorCreditRecordAmountsEditMode = useCallback(async (paymentData, originalPaymentData) => {
    try {
      console.log('🔄 Updating Vendor Credit record amounts in edit mode');

      console.log('🔄 Payment data:', paymentData);
      console.log('🔄 Original payment data:', originalPaymentData);
      // Reverse original applied amounts if they exist
      if (originalPaymentData && originalPaymentData.lines) {
        const reversePaymentData = { vendorBills: originalPaymentData.lines };
        await updateAppliedVendorBillAmounts(reversePaymentData, 'delete');
      }

      // Apply new amounts
      await updateAppliedVendorBillAmounts(paymentData, 'new');

      console.log('✅ Vendor Credit record amounts updated successfully in edit mode');
    } catch (error) {
      console.error('❌ Error updating Vendor Credit record amounts in edit mode:', error);
      throw error;
    }
  }, [updateAppliedVendorBillAmounts]);

  // Load VendorCredit payment lines (equivalent to loadCreditMemoPaymentLines)
  const loadVendorCreditPaymentLines = useCallback(async (vendorCreditId) => {
    try {
      console.log('📖 Loading existing Vendor Credit Payment Lines for:', vendorCreditId);

      const response = await fetch(`${apiConfig.baseURL}/vendor-credit-payment-line/by-vendor-credit/${vendorCreditId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (response.ok) {
        const paymentLines = await response.json();
        const paymentLinesArray = (paymentLines.lines || []);

        console.log('📖 Loaded Vendor Credit Payment Lines:', paymentLinesArray);
        return paymentLinesArray;
      } else if (response.status === 404) {
        console.log('📖 No existing Vendor Credit Payment Lines found');
        return [];
      } else {
        console.warn(`Failed to load Vendor Credit Payment Lines: ${response.status}`);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading Vendor Credit Payment Lines:', error);
      return [];
    }
  }, []);

  const validator = useCallback((values) => {
    const errors = {};

    // Skip validation for ItemReceipt when it has pre-populated data from sessionStorage
    if (recordType === 'ItemReceipt' && mode === 'new') {
      const hasSessionData = sessionStorage.getItem('purchaseOrderDataForReceiving');
      if (hasSessionData) {
        return errors;
      }
    }

    // Skip validation for VendorBill when it has pre-populated data from sessionStorage
    if (recordType === 'VendorBill' && mode === 'new') {
      const hasSessionData = sessionStorage.getItem('itemReceiptDataForBilling');
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
  }, [formConfig, recordType, mode]);

  // Helper function to map form fields to API structure
  const mapFormDataToAPI = (formValues, recordType) => {
    const mappedData = { ...formValues };

    // Ensure correct date field names based on transaction type
    switch (recordType) {
      case 'PurchaseOrder':
        // API expects 'poDate'
        if (mappedData.date && !mappedData.poDate) {
          mappedData.poDate = mappedData.date;
          delete mappedData.date;
        }
        break;
      case 'ItemReceipt':
        // API expects 'receiptDate'
        if (mappedData.date && !mappedData.receiptDate) {
          mappedData.receiptDate = mappedData.date;
          delete mappedData.date;
        }

        break;
      case 'VendorBill':
        // API expects 'invoiceDate'
        if (mappedData.date && !mappedData.invoiceDate) {
          mappedData.invoiceDate = mappedData.date;
          delete mappedData.date;
        }

        break;
      case 'VendorCredit':
        // API expects 'tranDate'
        if (mappedData.date && !mappedData.tranDate) {
          mappedData.tranDate = mappedData.date;
          delete mappedData.date;
        }

        break;
    }

    return mappedData;
  };

  // Helper function to separate form data
  const separateFormData = (formValues) => {
    // First map the form data to match API structure
    const mappedFormValues = mapFormDataToAPI(formValues, recordType);

    const standardData = {};
    const customData = {};

    Object.keys(mappedFormValues).forEach(key => {
      const value = mappedFormValues[key];
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
        totalAmount: 0,
        totalItemcount: 0
      };
    }

    let totalQuantity = 0;
    let totalTaxPercent = 0;
    let totalRate = 0;
    let totalTaxAmount = 0;
    let totalAmount = 0;
    let totalItemcount = 0;

    items.forEach((line) => {
      // Use quantity for all purchase transactions (no special case like Invoice/quantityDelivered)
      const quantity = Number(line.quantity || 0);
      totalQuantity += quantity;

      const rate = Number(line.rate || 0);
      const taxPercent = Number(line.taxPercent || 0);
      totalTaxPercent += taxPercent;

      // Calculate with proper rounding (matching PurchaseItems.js)
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

    console.log('📊 Calculated totals from items:', calculatedTotals);

    // Create header with default total amount (will be updated when line items are saved)
    // Remove items array from header data as it should be sent separately to line endpoints
    const { items, ...headerDataOnly } = standardData;

    // Format date fields to match API expectations
    const formattedHeaderData = { ...headerDataOnly };

    // Ensure date is in the correct format for the API
    if (formattedHeaderData.poDate && formattedHeaderData.poDate instanceof Date) {
      formattedHeaderData.poDate = formattedHeaderData.poDate.toISOString();
    }

    // Create header with actual total amount from items and detailed totals
    // All purchase transactions use standard calculation (no special logic like Invoice)
    const headerDataWithTotal = {
      ...formattedHeaderData,
      totalAmount: calculatedTotals.totalAmount,
      // Map calculated totals to header record attributes
      grossAmount: calculatedTotals.totalRate,      // Sum of all subtotals (quantity × rate)
      taxTotal: calculatedTotals.totalTaxAmount,    // Sum of all tax amounts
      subTotal: calculatedTotals.totalRate,         // Sum of all subtotals before tax
      netTotal: calculatedTotals.totalAmount,       // Final total including tax
      inactive: formattedHeaderData.inactive !== undefined ? formattedHeaderData.inactive : false
    };

    // Set Vendor Credit payment line data (similar to PaymentForm.js pattern)
    if (recordType === 'VendorCredit') {
      headerDataWithTotal['unApplied'] = vendorCreditPaymentLineData.unapplied || 0;
      headerDataWithTotal['applied'] = vendorCreditPaymentLineData.appliedTo || 0;

      if (parseInt(headerDataWithTotal.unApplied) == 0) {
        headerDataWithTotal.status = status["Closed"];
      } else {
        headerDataWithTotal.status = status["Open"];
      }
    } else {
      headerDataWithTotal.status = status["Open"];
    }

    // Generate and validate JV lines before creating the record (skip for PurchaseOrder)
    let validatedJvLines = null;
    if (recordType !== 'PurchaseOrder') {
      const lineItems = formValues.items || [];
      const jvValidation = await generateJvLines(lineItems, standardData.form, itemsTotalAmount, recordType);

      if (!jvValidation.isValid) {
        alert(jvValidation.errorMessage);
        return;
      }
      validatedJvLines = jvValidation.jvLines;
    }

    try {
      // Step 1: Create transaction header
      let createdRecord;

      switch (recordType) {
        case 'PurchaseOrder':
          if (!transactionHook.createPurchaseOrder) {
            throw new Error('createPurchaseOrder method not available');
          }
          createdRecord = await transactionHook.createPurchaseOrder(headerDataWithTotal);
          break;

        case 'ItemReceipt':
          if (!transactionHook.createItemReceipt) {
            throw new Error('createItemReceipt method not available');
          }
          createdRecord = await transactionHook.createItemReceipt(headerDataWithTotal);
          break;

        case 'VendorBill':
          if (!transactionHook.createVendorBill) {
            throw new Error('createVendorBill method not available');
          }
          headerDataWithTotal['amountDue'] = itemsTotalAmount;
          createdRecord = await transactionHook.createVendorBill(headerDataWithTotal);
          break;

        case 'VendorCredit':
          if (!transactionHook.createVendorCredit) {
            throw new Error('createVendorCredit method not available');
          }

          createdRecord = await transactionHook.createVendorCredit(headerDataWithTotal);
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

      console.log("lineItems", lineItems)
      if (lineItems.length > 0) {
        await createTransactionLineItems(recordId, lineItems);

        // Update PurchaseOrderLine ReceivedQty for ItemReceipt
        if (recordType === 'ItemReceipt') {
          const enrichedLineItems = lineItems.map(item => ({
            ...item,
            receiptId: recordId
          }));
          await updatePurchaseOrderLineQuantities(enrichedLineItems, false, []);
        }

        // Update ItemReceiptLine InvoicedQty for VendorBill
        if (recordType === 'VendorBill') {
          const enrichedLineItems = lineItems.map(item => ({
            ...item,
            vendorBillId: recordId
          }));
          await updateItemReceiptLineQuantities(enrichedLineItems, false, []);
        }
      }

      // Step 2.4: Process JV lines (skip for PurchaseOrder)
      if (recordType !== 'PurchaseOrder' && validatedJvLines) {
        const jvLinesWithRecordId = validatedJvLines.map(line => ({
          ...line,
          recordId: recordId,
          recordType: recordType,
          id: null
        }));

        await processJournal(jvLinesWithRecordId, 'new', recordId, recordType);
      }

      // Step 2.5: Handle VendorCredit payment lines creation
      if (recordType === 'VendorCredit') {
        console.log('🔍 VendorCredit creation - vendorCreditPaymentLineData:', vendorCreditPaymentLineData);
        if (vendorCreditPaymentLineData && vendorCreditPaymentLineData.vendorBills?.length > 0) {
          const checkedVendorBills = vendorCreditPaymentLineData.vendorBills.filter(vendorBill => vendorBill.checked) || [];
          console.log('🔍 Checked vendor bills:', checkedVendorBills);
          if (checkedVendorBills.length > 0) {
            const vendorCreditSeqNum = headerDataWithTotal?.sequenceNumber || '';
            await createVendorCreditPaymentLines(recordId, vendorCreditSeqNum, checkedVendorBills);
            await updateAppliedVendorBillAmounts(vendorCreditPaymentLineData, 'new');
          }
        } else {
          console.log('❌ No vendor bills to apply credit to');
        }
      }

      // Step 3: Auto-update parent record status to "Closed" if fully received/invoiced
      await updateParentRecordStatusIfComplete(recordType, standardData);

      return recordId;
    } catch (error) {
      throw error;
    }
  };

  // Helper function to update transaction line items (exact FormCreator.js pattern)
  const updateTransactionLineItemsSimple = async (newLineItems) => {

    // Define API endpoints for each transaction type
    const transactionConfig = {
      PurchaseOrder: {
        endpoint: `${apiConfig.baseURL}/purchase-order-line`,
        getEndpoint: `${apiConfig.baseURL}/purchase-order-line/by-purchase-order/${id}`,
        idField: 'poid',
        quantityField: 'quantity'
      },
      ItemReceipt: {
        endpoint: `${apiConfig.baseURL}/item-receipt-line`,
        getEndpoint: `${apiConfig.baseURL}/item-receipt-line/by-item-receipt/${id}`,
        idField: 'irid',
        quantityField: 'quantity'
      },
      VendorBill: {
        endpoint: `${apiConfig.baseURL}/vendor-bill-line`,
        getEndpoint: `${apiConfig.baseURL}/vendor-bill-line/by-vendor-bill/${id}`,
        idField: 'vbid',
        quantityField: 'quantityDelivered'
      },
      VendorCredit: {
        endpoint: `${apiConfig.baseURL}/vendor-credit-line`,
        getEndpoint: `${apiConfig.baseURL}/vendor-credit-line/by-vendor-credit/${id}`,
        idField: 'vcid',
        quantityField: 'quantity'
      }
    };

    const config = transactionConfig[recordType];
    if (!config) {
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
        const quantityValue = recordType === 'ItemReceipt'
          ? Number(item.quantityReceived || 0)
          : Number(item.quantity || item.quantityDelivered || 0);

        const linePayload = {
          id: item.id, // Include ID for bulk update
          [config.idField]: id,
          itemID: item.itemID || item.itemId,
          [config.quantityField]: quantityValue,
          rate: parseFloat(item.rate || 0),
          discount: parseFloat(item.discount || 0),
          taxID: item.taxID || item.taxId,
          taxPercent: parseFloat(item.taxPercent || 0),
          taxAmount: parseFloat(item.taxAmount || 0),
          taxRate: parseFloat(item.taxRate || 0),
          amount: parseFloat(item.amount || item.totalAmount || 0)
        };

        // Add parent line ID fields for proper duplicate item tracking
        if (recordType === 'ItemReceipt' && item.purchaseOrderLineId) {
          linePayload.purchaseOrderLineId = item.purchaseOrderLineId;
        }
        if (recordType === 'VendorBill' && item.itemReceiptLineId) {
          linePayload.itemReceiptLineId = item.itemReceiptLineId;
        }

        return cleanPayload(linePayload);
      });

      // Step 5: Build create payloads for bulk POST
      const createPayloads = itemsToCreate.map(item => {
        const quantityValue = recordType === 'ItemReceipt'
          ? Number(item.quantityReceived || 0)
          : Number(item.quantity || item.quantityDelivered || 0);

        const linePayload = {
          [config.idField]: id,
          itemID: item.itemID || item.itemId,
          [config.quantityField]: quantityValue,
          rate: parseFloat(item.rate || 0),
          discount: parseFloat(item.discount || 0),
          taxID: item.taxID || item.taxId,
          taxPercent: parseFloat(item.taxPercent || 0),
          taxAmount: parseFloat(item.taxAmount || 0),
          taxRate: parseFloat(item.taxRate || 0),
          amount: parseFloat(item.amount || item.totalAmount || 0)
        };

        // Add parent line ID fields for proper duplicate item tracking
        if (recordType === 'ItemReceipt' && item.purchaseOrderLineId) {
          linePayload.purchaseOrderLineId = item.purchaseOrderLineId;
        }
        if (recordType === 'VendorBill' && item.itemReceiptLineId) {
          linePayload.itemReceiptLineId = item.itemReceiptLineId;
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

      // For ItemReceipt: Update inventory for modified items
      if (recordType === 'ItemReceipt' && selectedLocation) {
        const locationId = selectedLocation?.value || selectedLocation;

        let originalItems = [];
        if (mode === 'edit' && existingItems.length > 0) {
          originalItems = existingItems;
        }
        await updatePurchaseOrderLineQuantities(newLineItems, mode === 'edit', originalItems);


        // Step 1: Reverse inventory for deleted items (BULK - subtract quantity back)
        if (itemsToDelete.length > 0) {
          try {
            console.log(`🔄 Bulk reversing inventory for ${itemsToDelete.length} deleted items`);

            // Collect all inventory updates
            const inventoryUpdates = [];
            for (const deletedItem of itemsToDelete) {
              const itemId = deletedItem.itemID || deletedItem.itemId;
              const quantity = parseFloat(deletedItem.quantity || 0);

              if (itemId && locationId && quantity !== 0) {
                // Check current inventory
                const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
                if (inventoryDetail) {
                  const currentQty = Number(inventoryDetail.quantityAvailable || 0);
                  const newQty = currentQty - quantity; // Subtract the quantity

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

        console.log('itemsToUpdate', itemsToUpdate);
        console.log('existingItems', existingItems);
        // Step 2: Update inventory for modified items (BULK)
        if (itemsToUpdate.length > 0) {
          try {
            console.log(`🔄 Bulk updating inventory for ${itemsToUpdate.length} modified items`);

            // Collect reversals and new receipts
            const inventoryReversals = [];
            const newReceipts = [];

            for (const updatedItem of itemsToUpdate) {
              const itemId = updatedItem.itemID || updatedItem.itemId;
              const newQuantity = parseFloat(updatedItem.quantityReceived || 0);

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
                    const reversedQty = currentQty - originalQuantity; // Subtract original quantity

                    inventoryReversals.push({
                      itemId: itemId,
                      locationId: locationId,
                      quantity: reversedQty
                    });

                    console.log(`Prepared reversal for item ${itemId}: ${currentQty} → ${reversedQty}`);
                  }
                }

                // Then prepare the new receipt (processItemReceipt handles average cost)
                if (newQuantity > 0) {
                  newReceipts.push({
                    itemId: itemId,
                    locationId: locationId,
                    receiptQty: newQuantity,
                    receiptCost: parseFloat(updatedItem.rate || 0),
                    mode: 'create'
                  });
                }
              }
            }

            // Execute bulk operations
            if (inventoryReversals.length > 0) {
              await bulkSetInventoryQuantity(inventoryReversals);
              console.log(`✅ Bulk reversed inventory for ${inventoryReversals.length} updated items`);
            }

            if (newReceipts.length > 0) {
              await bulkProcessItemReceipt(newReceipts);
              console.log(`✅ Bulk processed receipts for ${newReceipts.length} updated items`);
            }
          } catch (inventoryError) {
            console.error(`❌ Failed to bulk update inventory for modified items:`, inventoryError.message);
          }
        }

        // Step 3: Process newly created items (BULK - add to inventory)
        if (itemsToCreate.length > 0) {
          try {
            console.log(`🔄 Bulk processing ${itemsToCreate.length} newly created items`);

            // Collect all new receipts
            const newReceipts = [];
            for (const createdItem of itemsToCreate) {
              const itemId = createdItem.itemID || createdItem.itemId;
              const quantity = parseFloat(createdItem.quantityReceived || 0);

              if (itemId && locationId && quantity !== 0) {
                newReceipts.push({
                  itemId: itemId,
                  locationId: locationId,
                  receiptQty: quantity,
                  receiptCost: parseFloat(createdItem.rate || 0),
                  mode: 'create'
                });
              }
            }

            // Execute bulk operation
            if (newReceipts.length > 0) {
              await bulkProcessItemReceipt(newReceipts);
              console.log(`✅ Bulk processed receipts for ${newReceipts.length} newly created items`);
            }
          } catch (inventoryError) {
            console.error(`❌ Failed to bulk process inventory for newly created items:`, inventoryError.message);
          }
        }
      }

      // For Invoice: Update ItemFulfillmentLine quantities for partial invoicing
      if (recordType === 'VendorBill') {
        let originalItems = [];
        if (mode === 'edit') {
          // Get original items for edit mode to reverse quantities
          originalItems = existingItems;
        }

        await updateItemReceiptLineQuantities(newLineItems, mode === 'edit', originalItems);
      }

    } catch (error) {
      throw error;
    }
  };

  // Helper function to update PurchaseOrderLine quantities for partial receiving
  const updatePurchaseOrderLineQuantities = async (receiptItems, isEdit = false, originalReceiptItems = []) => {
    if (recordType !== 'ItemReceipt') return;

    let purchaseOrderId = formData.poid || formData.purchaseOrderId;

    // If no purchase order ID in formData, try to get it from the receipt items
    if (!purchaseOrderId && receiptItems.length > 0) {
      const firstItem = receiptItems[0];
      if (firstItem && (firstItem.poid || firstItem.purchaseOrderId)) {
        purchaseOrderId = firstItem.poid || firstItem.purchaseOrderId;
      }
    }

    // If still no purchase order ID, try to get it from session storage
    if (!purchaseOrderId) {
      try {
        const purchaseOrderDataString = sessionStorage.getItem('purchaseOrderDataForReceiving');
        if (purchaseOrderDataString) {
          const purchaseOrderData = JSON.parse(purchaseOrderDataString);
          if (purchaseOrderData.poid) {
            purchaseOrderId = purchaseOrderData.poid;
          }
        }
      } catch (error) {
      }
    }

    // If still no purchase order ID, try to fetch from the created receipt record
    if (!purchaseOrderId) {
      const receiptId = receiptItems[0]?.receiptId || id;
      if (receiptId) {
        try {
          const receiptResponse = await fetch(`${apiConfig.baseURL}/item-receipt/${receiptId}`, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
          });

          if (receiptResponse.ok) {
            const receiptData = await receiptResponse.json();
            purchaseOrderId = receiptData.poid || receiptData.purchaseOrderId;
          }
        } catch (error) {
        }
      }
    }

    if (!purchaseOrderId) {
      return;
    }

    try {
      // Get current PurchaseOrderLine items
      const purchaseOrderLinesResponse = await fetch(`${apiConfig.baseURL}/purchase-order-line/by-purchase-order/${purchaseOrderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY' // Add your API key here
        }
      });

      if (!purchaseOrderLinesResponse.ok) {
        throw new Error('Failed to fetch purchase order lines');
      }

      const purchaseOrderLinesData = await purchaseOrderLinesResponse.json();
      const purchaseOrderLines = Array.isArray(purchaseOrderLinesData) ? purchaseOrderLinesData :
        (purchaseOrderLinesData.results || Object.values(purchaseOrderLinesData).find(v => Array.isArray(v)) || []);

      // IMPORTANT: Track quantity CHANGES per PurchaseOrderLine, not absolute values
      // This prevents issues when multiple ItemReceipt lines reference the same purchaseOrderLineId
      const quantityChanges = new Map(); // Map<purchaseOrderLineId, totalQuantityChange>

      // Create maps by unique ID for matching
      const originalItemsById = new Map();

      originalReceiptItems.forEach(originalItem => {
        const uniqueId = originalItem.id || originalItem.tempId;
        if (uniqueId) {
          originalItemsById.set(uniqueId, originalItem);
        }
      });

      const currentItemsById = new Map();
      receiptItems.forEach(item => {
        const uniqueId = item.id || item.tempId;
        if (uniqueId) {
          currentItemsById.set(uniqueId, item);
        }
      });

      console.log('[updatePurchaseOrderLineQuantities] Processing changes:');
      console.log('- Original items by ID:', Array.from(originalItemsById.keys()));
      console.log('- Current items by ID:', Array.from(currentItemsById.keys()));

      // Process each original item
      originalItemsById.forEach((originalItem, uniqueId) => {
        const currentItem = currentItemsById.get(uniqueId);
        const purchaseOrderLineId = originalItem.purchaseOrderLineId || originalItem.poLineId;

        if (!purchaseOrderLineId) return;

        const currentChange = quantityChanges.get(purchaseOrderLineId) || 0;
        const originalQuantity = parseFloat(originalItem.quantityReceived || originalItem.quantity || 0);

        if (currentItem) {
          // LINE WAS EDITED - calculate only the DIFFERENCE
          const currentQuantity = parseFloat(currentItem.quantityReceived || currentItem.quantity || 0);
          const quantityDifference = currentQuantity - originalQuantity;
          quantityChanges.set(purchaseOrderLineId, currentChange + quantityDifference);
          console.log(`[PO Line ${purchaseOrderLineId}] EDITED: uniqueId=${uniqueId}, was ${originalQuantity}, now ${currentQuantity}, diff: ${quantityDifference}`);
          // Remove from current map so we know it was processed
          currentItemsById.delete(uniqueId);
        } else {
          // LINE WAS REMOVED - subtract the original quantity
          quantityChanges.set(purchaseOrderLineId, currentChange - originalQuantity);
          console.log(`[PO Line ${purchaseOrderLineId}] REMOVED: uniqueId=${uniqueId}, quantity: ${originalQuantity}`);
        }
      });

      // Process remaining current items (NEWLY ADDED)
      currentItemsById.forEach((item, uniqueId) => {
        const purchaseOrderLineId = item.purchaseOrderLineId || item.poLineId;

        if (!purchaseOrderLineId) return;

        const currentChange = quantityChanges.get(purchaseOrderLineId) || 0;
        const newQuantity = parseFloat(item.quantityReceived || item.quantity || 0);
        quantityChanges.set(purchaseOrderLineId, currentChange + newQuantity);
        console.log(`[PO Line ${purchaseOrderLineId}] ADDED: uniqueId=${uniqueId}, quantity: ${newQuantity}`);
      });

      console.log('[updatePurchaseOrderLineQuantities] Final quantity changes:', Array.from(quantityChanges.entries()));

      // Build update payloads for all purchase order lines
      const updatePayloads = purchaseOrderLines
        .filter(poLine => poLine.id) // Only process lines with IDs
        .map((poLine) => {
          let newQuantityReceived = Number(poLine.receivedQty || 0);

          // Apply the net change
          if (quantityChanges.has(poLine.id)) {
            const quantityChange = quantityChanges.get(poLine.id);
            newQuantityReceived += quantityChange;
            console.log(`[PO Line ${poLine.id}] Applying change: current=${poLine.receivedQty}, change=${quantityChange}, new=${newQuantityReceived}`);
          }

          // Ensure quantity received doesn't exceed ordered quantity
          const orderedQuantity = poLine.quantity || 0;
          newQuantityReceived = Math.min(Math.max(0, newQuantityReceived), orderedQuantity);

          // Build the update payload
          const updatePayload = {
            id: poLine.id, // Include ID for bulk update
            receivedQty: newQuantityReceived
          };

          return cleanPayload(updatePayload);
        });

      // Send bulk PUT request if there are lines to update
      if (updatePayloads.length > 0) {
        const bulkUpdatePayload = {
          lines: updatePayloads
        };

        console.log(`📤 [PurchaseOrderLine Bulk Update] Sending ${updatePayloads.length} lines:`, bulkUpdatePayload);

        const bulkUpdateResponse = await fetch(`${apiConfig.baseURL}/purchase-order-line`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bulkUpdatePayload)
        });

        if (!bulkUpdateResponse.ok) {
          const errorText = await bulkUpdateResponse.text();
          console.warn(`Failed to bulk update PurchaseOrderLine quantities: ${bulkUpdateResponse.status} - ${errorText}`);
        } else {
          console.log(`✅ [PurchaseOrderLine Bulk Update] Successfully updated ${updatePayloads.length} lines`);
        }
      }


      if (purchaseOrderId && isEdit) {
        try {
          const statusUpdateResponse = await fetch(`${apiConfig.baseURL}/purchase-order/${purchaseOrderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: status["Open"]
            })
          });

          if (!statusUpdateResponse.ok) {
            console.warn(`Failed to update PurchaseOrder ${purchaseOrderId} status:`, statusUpdateResponse.status);
          }
        } catch (error) {
          console.error(`Error updating purchaseOrderId ${purchaseOrderId} status:`, error);
        }
      }

    } catch (error) {
      // Don't throw - this is supplementary functionality
    }
  };

  // Helper function to update ItemReceiptLine quantities for partial invoicing
  const updateItemReceiptLineQuantities = async (vendorBillItems, isEdit = false, originalVendorBillItems = []) => {
    if (recordType !== 'VendorBill') return;

    let itemReceiptId = formData.irid || formData.itemReceiptId;

    // If no item receipt ID in formData, try to get it from the vendor bill items
    if (!itemReceiptId && vendorBillItems.length > 0) {
      // For new vendor bills, get IRID from the vendor bill line items
      const firstItem = vendorBillItems[0];
      if (firstItem && (firstItem.irid || firstItem.itemReceiptId)) {
        itemReceiptId = firstItem.irid || firstItem.itemReceiptId;
      }
    }

    // If still no item receipt ID, try to get it from session storage (for new vendor bills from item receipts)
    if (!itemReceiptId) {
      try {
        const itemReceiptDataString = sessionStorage.getItem('itemReceiptDataForBilling');
        if (itemReceiptDataString) {
          const itemReceiptData = JSON.parse(itemReceiptDataString);
          if (itemReceiptData.irid) {
            itemReceiptId = itemReceiptData.irid;
          }
        }
      } catch (error) {
        console.error('Error parsing ItemReceipt data from session storage:', error);
      }
    }

    if (!itemReceiptId) {
      console.warn('No ItemReceipt ID found for updating quantities');
      return;
    }

    try {
      // Get current ItemReceiptLine records
      const response = await fetch(`${apiConfig.baseURL}/item-receipt-line/by-item-receipt/${itemReceiptId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ItemReceiptLine records: ${response.status}`);
      }

      const responseData = await response.json();
      const itemReceiptLines = responseData.lines || [];

      if (itemReceiptLines.length === 0) {
        console.warn('No ItemReceiptLine records found');
        return;
      }

      // IMPORTANT: Track quantity CHANGES per ItemReceiptLine, not absolute values
      // This prevents issues when multiple VendorBill lines reference the same itemReceiptLineId
      const quantityChanges = new Map(); // Map<itemReceiptLineId, totalQuantityChange>

      // Create maps by unique ID for matching
      const originalItemsById = new Map();
      originalVendorBillItems.forEach(originalItem => {
        const uniqueId = originalItem.id || originalItem.tempId;
        if (uniqueId) {
          originalItemsById.set(uniqueId, originalItem);
        }
      });

      const currentItemsById = new Map();
      vendorBillItems.forEach(item => {
        const uniqueId = item.id || item.tempId;
        if (uniqueId) {
          currentItemsById.set(uniqueId, item);
        }
      });

      console.log('[updateItemReceiptLineQuantities] Processing changes:');
      console.log('- Original items by ID:', Array.from(originalItemsById.keys()));
      console.log('- Current items by ID:', Array.from(currentItemsById.keys()));

      // Process each original item
      originalItemsById.forEach((originalItem, uniqueId) => {
        const currentItem = currentItemsById.get(uniqueId);
        const itemReceiptLineId = originalItem.itemReceiptLineId || originalItem.irLineId;

        if (!itemReceiptLineId) return;

        const currentChange = quantityChanges.get(itemReceiptLineId) || 0;
        const originalQuantity = parseFloat(originalItem.quantityInvoiced || originalItem.quantity || 0);

        if (currentItem) {
          // LINE WAS EDITED - calculate only the DIFFERENCE
          const currentQuantity = parseFloat(currentItem.quantityInvoiced || currentItem.quantity || 0);
          const quantityDifference = currentQuantity - originalQuantity;
          quantityChanges.set(itemReceiptLineId, currentChange + quantityDifference);
          console.log(`[IR Line ${itemReceiptLineId}] EDITED: uniqueId=${uniqueId}, was ${originalQuantity}, now ${currentQuantity}, diff: ${quantityDifference}`);
          // Remove from current map so we know it was processed
          currentItemsById.delete(uniqueId);
        } else {
          // LINE WAS REMOVED - subtract the original quantity
          quantityChanges.set(itemReceiptLineId, currentChange - originalQuantity);
          console.log(`[IR Line ${itemReceiptLineId}] REMOVED: uniqueId=${uniqueId}, quantity: ${originalQuantity}`);
        }
      });

      // Process remaining current items (NEWLY ADDED)
      currentItemsById.forEach((item, uniqueId) => {
        const itemReceiptLineId = item.itemReceiptLineId || item.irLineId;

        if (!itemReceiptLineId) return;

        const currentChange = quantityChanges.get(itemReceiptLineId) || 0;
        const newQuantity = parseFloat(item.quantityInvoiced || item.quantity || 0);
        quantityChanges.set(itemReceiptLineId, currentChange + newQuantity);
        console.log(`[IR Line ${itemReceiptLineId}] ADDED: uniqueId=${uniqueId}, quantity: ${newQuantity}`);
      });

      console.log('[updateItemReceiptLineQuantities] Final quantity changes:', Array.from(quantityChanges.entries()));

      // Build update payloads for all item receipt lines
      const updatePayloads = itemReceiptLines
        .filter(irLine => irLine.id) // Only process lines with IDs
        .map((irLine) => {
          const quantityChange = quantityChanges.get(irLine.id) || 0;

          const currentInvoicedQty = parseFloat(irLine.invoicedQty || 0);
          const newInvoicedQty = currentInvoicedQty + quantityChange;

          console.log(`[IR Line ${irLine.id}] Applying change: current=${currentInvoicedQty}, change=${quantityChange}, new=${newInvoicedQty}`);

          // Prevent over-invoicing - cap at received quantity and ensure non-negative
          const maxInvoicedQty = irLine.quantity || 0;
          const finalInvoicedQty = Math.min(Math.max(0, newInvoicedQty), maxInvoicedQty);

          // Build the update payload
          const updatePayload = {
            id: irLine.id, // Include ID for bulk update
            invoicedQty: finalInvoicedQty
          };

          return cleanPayload(updatePayload);
        });

      // Send bulk PUT request if there are lines to update
      if (updatePayloads.length > 0) {
        const bulkUpdatePayload = {
          lines: updatePayloads
        };

        console.log(`📤 [ItemReceiptLine Bulk Update] Sending ${updatePayloads.length} lines:`, bulkUpdatePayload);

        const bulkUpdateResponse = await fetch(`${apiConfig.baseURL}/item-receipt-line`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bulkUpdatePayload)
        });

        if (!bulkUpdateResponse.ok) {
          const errorText = await bulkUpdateResponse.text();
          console.warn(`Failed to bulk update ItemReceiptLine quantities: ${bulkUpdateResponse.status} - ${errorText}`);
        } else {
          console.log(`✅ [ItemReceiptLine Bulk Update] Successfully updated ${updatePayloads.length} lines`);
        }
      }

      // Update ItemReceipt status to "Open" if itemReceiptId is available and in edit mode
      if (itemReceiptId && isEdit) {
        try {
          console.log(`[Status Update] Setting ItemReceipt ${itemReceiptId} status to Open`);
          const statusUpdateResponse = await fetch(`${apiConfig.baseURL}/item-receipt/${itemReceiptId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: status["Open"]
            })
          });

          if (statusUpdateResponse.ok) {
            console.log(`✅ ItemReceipt ${itemReceiptId} status updated to Open`);
          } else {
            console.warn(`Failed to update ItemReceipt ${itemReceiptId} status:`, statusUpdateResponse.status);
          }
        } catch (error) {
          console.error(`Error updating ItemReceipt ${itemReceiptId} status:`, error);
        }
      }

    } catch (error) {
      // Don't throw - this is supplementary functionality
    }
  };

  // Helper function to update parent record status to "Closed" if fully received/invoiced
  const updateParentRecordStatusIfComplete = async (recordType, standardData) => {
    try {
      if (recordType === 'ItemReceipt') {
        // Check if PurchaseOrder is fully received
        const purchaseOrderId = standardData.poid || standardData.purchaseOrderId;
        if (purchaseOrderId) {

          // Call unreceived API to check remaining unreceived items
          const response = await fetch(`${apiConfig.baseURL}/purchase-order-line/unreceived?POID=${purchaseOrderId}`, {
            method: 'GET',
            headers: apiConfig.headers
          });

          if (response.ok) {
            const unreceivedData = await response.json();
            console.log(`[Status Update] Unreceived API response for PO ${purchaseOrderId}:`, unreceivedData);
            const unreceivedCount = unreceivedData.results?.length || 0;
            console.log(`[Status Update] Unreceived count for PO ${purchaseOrderId}: ${unreceivedCount}`);

            if (unreceivedCount === 0) {
              // Update PurchaseOrder status to "Closed"
              console.log(`[Status Update] Setting PurchaseOrder ${purchaseOrderId} status to Closed`);

              const updateResponse = await fetch(`${apiConfig.baseURL}/purchase-order/${purchaseOrderId}`, {
                method: 'PUT',
                headers: apiConfig.headers,
                body: JSON.stringify({
                  status: status["Closed"]
                })
              });

              if (updateResponse.ok) {
                console.log(`✅ PurchaseOrder ${purchaseOrderId} status updated to Closed`);
              } else {
                console.warn(`Failed to update PurchaseOrder ${purchaseOrderId} status:`, updateResponse.status);
              }
            } else {
              console.log(`[Status Update] PO ${purchaseOrderId} still has ${unreceivedCount} unreceived items, keeping status Open`);
            }
          } else {
            console.error(`[Status Update] Failed to fetch unreceived items for PO ${purchaseOrderId}:`, response.status);
          }
        }
      } else if (recordType === 'VendorBill') {
        // Check if ItemReceipt is fully invoiced
        const itemReceiptId = standardData.irid || standardData.itemReceiptId;
        if (itemReceiptId) {
          console.log(`[Status Update] Checking if ItemReceipt ${itemReceiptId} is fully invoiced...`);

          // Call uninvoiced API to check remaining uninvoiced items
          const response = await fetch(`${apiConfig.baseURL}/item-receipt-line/uninvoiced?IRID=${itemReceiptId}`, {
            method: 'GET',
            headers: apiConfig.headers
          });

          if (response.ok) {
            const uninvoicedData = await response.json();
            const uninvoicedCount = uninvoicedData.results?.length || 0;
            if (uninvoicedCount === 0) {
              const updateResponse = await fetch(`${apiConfig.baseURL}/item-receipt/${itemReceiptId}`, {
                method: 'PUT',
                headers: apiConfig.headers,
                body: JSON.stringify({
                  status: status["Closed"]
                })
              });

              if (updateResponse.ok) {
                console.log(`✅ ItemReceipt ${itemReceiptId} status updated to Closed`);
              } else {
                console.warn(`Failed to update ItemReceipt ${itemReceiptId} status:`, updateResponse.status);
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

  // Helper function to create transaction line items
  const createTransactionLineItems = async (headerId, lineItems) => {

    // Define API endpoints and field mappings for each transaction type
    const getLineItemEndpoint = () => {
      switch (recordType) {
        case 'PurchaseOrder':
          return { endpoint: `${apiConfig.baseURL}/purchase-order-line`, idField: 'poid' };
        case 'ItemReceipt':
          return { endpoint: `${apiConfig.baseURL}/item-receipt-line`, idField: 'irid' };
        case 'VendorBill':
          return { endpoint: `${apiConfig.baseURL}/vendor-bill-line`, idField: 'vbid' };
        case 'VendorCredit':
          return { endpoint: `${apiConfig.baseURL}/vendor-credit-line`, idField: 'vcid' };
        default:
          throw new Error(`Unknown transaction type: ${recordType}`);
      }
    };

    const config = getLineItemEndpoint();

    if (!config) {
      throw new Error(`Unsupported record type: ${recordType}`);
    }

    // Build all line payloads for bulk creation
    const linesToCreate = lineItems.map((line, index) => {
      let quantity = 0
      if (recordType == "ItemReceipt") {
        quantity = Number(line.quantityReceived);
      }
      else {
        quantity = Number(line.quantity || Number(line.quantityDelivered) || 0);
      }
      const rate = Number(line.rate || 0);
      const discountAmount = Number(line.discountAmount || 0);
      const taxPercent = Number(line.taxPercent || 0);

      // Calculate amounts
      const subtotal = quantity * rate - discountAmount;
      const taxAmount = subtotal * taxPercent / 100;
      const totalAmount = subtotal + taxAmount;

      // Build line payload based on transaction type
      const linePayload = {
        [config.idField]: headerId,
        itemID: line.itemID?.value || line.itemID,
        quantity: quantity,
        rate: rate,
        discountAmount: discountAmount,
        taxID: line.taxID?.value || line.taxID,
        taxPercent: taxPercent,
        taxAmount: taxAmount,
        totalAmount: totalAmount
      };

      // Add parent line ID fields for proper duplicate item tracking
      if (recordType === 'ItemReceipt' && line.purchaseOrderLineId) {
        linePayload.purchaseOrderLineId = line.purchaseOrderLineId;
      }
      if (recordType === 'VendorBill' && line.itemReceiptLineId) {
        linePayload.itemReceiptLineId = line.itemReceiptLineId;
      }

      return cleanPayload(linePayload);
    });

    // Execute bulk POST if there are lines to create
    if (linesToCreate.length > 0) {
      const bulkCreatePayload = {
        lines: linesToCreate
      };

      console.log(`📤 [${recordType} Line Bulk Create] Sending ${linesToCreate.length} lines:`, bulkCreatePayload);

      const bulkCreateResponse = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(bulkCreatePayload)
      });

      if (!bulkCreateResponse.ok) {
        const errorData = await bulkCreateResponse.text();
        throw new Error(`Failed to bulk create line items: ${bulkCreateResponse.status} - ${errorData}`);
      }

      console.log(`✅ [${recordType} Line Bulk Create] Successfully created ${linesToCreate.length} lines`);
    }

    // Update inventory - add quantities to location (BULK - items coming into warehouse)
    if (recordType === 'ItemReceipt') {
      // Get location from selectedLocation state or formData as fallback
      const locationId = selectedLocation?.value || selectedLocation || formData.locationID;

      if (locationId && lineItems.length > 0) {
        try {
          console.log(`🔄 Bulk processing ${lineItems.length} ItemReceipts for create mode`);

          // Collect all receipts
          const receipts = [];
          for (const line of lineItems) {
            const itemId = line.itemID?.value || line.itemID;
            const quantity = Number(line.quantityReceived || 0);

            if (itemId && locationId && quantity !== 0) {
              receipts.push({
                itemId: itemId,
                locationId: locationId,
                receiptQty: quantity,
                receiptCost: Number(line.rate || 0),
                mode: 'create'
              });
            }
          }

          // Execute bulk operation
          if (receipts.length > 0) {
            await bulkProcessItemReceipt(receipts);
            console.log(`✅ Bulk processed receipts for ${receipts.length} items in create mode`);
          }
        } catch (inventoryError) {
          console.error(`❌ Failed to bulk update inventory in create mode:`, inventoryError.message);
          // Don't throw here - we want the receipt creation to succeed even if inventory update fails
        }
      }
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
  const updateRecord = async (standardData, customData, typeOfRecordId, formValues) => {
    if (!transactionHook) {
      throw new Error(`No hook available for record type: ${recordType}`);
    }

    // Calculate totals from form items
    const lineItems = formValues?.items || [];
    const calculatedTotals = calculateTotalsFromItems(lineItems);

    console.log('📊 [Update] Calculated totals from items:', calculatedTotals);

    // Stage 1: Update the main record with standard data and calculated totals
    // All purchase transactions use standard calculation (no special logic like Invoice)
    let transactionData = {
      ...standardData,
      id,
      totalAmount: calculatedTotals.totalAmount,
      // Map calculated totals to header record attributes
      grossAmount: calculatedTotals.totalRate,      // Sum of all subtotals (quantity × rate)
      taxTotal: calculatedTotals.totalTaxAmount,    // Sum of all tax amounts
      subTotal: calculatedTotals.totalRate,         // Sum of all subtotals before tax
      netTotal: calculatedTotals.totalAmount        // Final total including tax
    };

    try {
      switch (recordType) {
        case 'PurchaseOrder':
          if (!transactionHook.updatePurchaseOrder) {
            throw new Error('updatePurchaseOrder method not available');
          }
          await transactionHook.updatePurchaseOrder(id, transactionData);
          break;

        case 'ItemReceipt':
          if (!transactionHook.updateItemReceipt) {
            throw new Error('updateItemReceipt method not available');
          }
          await transactionHook.updateItemReceipt(id, transactionData);
          break;

        case 'VendorBill':
          if (!transactionHook.updateVendorBill) {
            throw new Error('updateVendorBill method not available');
          }
          // Fetch current amountPaid from database to calculate amountDue
          let currentAmountPaid = 0;
          try {
            const fetchResponse = await fetch(buildUrl(`/vendor-bill/${id}`), {
              method: 'GET',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            if (fetchResponse.ok) {
              const currentRecord = await fetchResponse.json();
              currentAmountPaid = currentRecord.amountPaid || 0;
            }
          } catch (error) {
            console.warn('Failed to fetch current amountPaid for VendorBill:', error);
          }
          // Calculate amountDue = totalAmount - amountPaid
          const calculatedAmountDue = Math.max(0, calculatedTotals.totalAmount - currentAmountPaid);
          transactionData['amountDue'] = calculatedAmountDue;
          console.log(`📊 VendorBill Update - TotalAmount: ${calculatedTotals.totalAmount}, AmountPaid: ${currentAmountPaid}, AmountDue: ${calculatedAmountDue}`);
          await transactionHook.updateVendorBill(id, transactionData);
          break;

        case 'VendorCredit':
          if (!transactionHook.updateVendorCredit) {
            throw new Error('updateVendorCredit method not available');
          }
          transactionData['amountDue'] = calculatedTotals.totalAmount;
          await transactionHook.updateVendorCredit(id, transactionData);
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
    try {
      setLoading(true);
      setError(null);

      const { standardData, customData } = separateFormData(formValues);
      const typeOfRecordId = getTypeOfRecordId();

      if (mode === 'new') {
        // Stage 1: Create main record
        const recordId = await createMainRecord(standardData, formValues);

       
        // Stage 3: Create custom field values
        await createCustomFieldValues(customData, recordId, typeOfRecordId);

        // Success notification
        showNotification(`${recordType} created successfully with ${Object.keys(customData).length} custom fields`, 'success');

        // Clear sessionStorage after successful creation
        if (recordType === 'ItemReceipt') {
          sessionStorage.removeItem('purchaseOrderDataForReceiving');
        }
        if (recordType === 'VendorBill') {
          sessionStorage.removeItem('itemReceiptDataForBilling');
        }

      } else {
        // Update mode - following FormCreator.js exact pattern

        // Stage 1: Update main transaction record
        const customFieldCount = await updateRecord(standardData, customData, typeOfRecordId, formValues);

        // Stage 2: Handle line items updates (exact FormCreator.js pattern)
        if (formValues.items && formValues.items.length > 0) {
          // Get original line items for quantity tracking
          console.log("formValues.items", formValues.items)
          const originalLineItems = originalFormData.current?.items || [];
          await updateTransactionLineItemsSimple(formValues.items);
        }

        // Stage 3: Validate, delete existing JV lines, and create new ones for edit mode (skip for PurchaseOrder)
        if (recordType !== 'PurchaseOrder') {
          const lineItems = formValues.items || [];

          // Step 3.1: VALIDATE new JV lines FIRST (before deleting old ones)
          if (lineItems.length > 0) {
            const jvValidation = await generateJvLines(lineItems, standardData.form, itemsTotalAmount, recordType);

            // If validation fails, stop and show error (don't delete anything!)
            if (!jvValidation.isValid) {
              alert(jvValidation.errorMessage);
              setLoading(false);
              return;
            }

            // Step 3.2: Validation passed - now safe to delete old journal entry lines
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

                console.log('🔄 [PurchaseForm Edit] Calling processJournal for delete operation with changes:', changes);
                await processJournal(changes, 'delete');
              }
            } catch (error) {
              console.error('Error deleting journal entry lines:', error);
              throw error; // Re-throw to stop execution
            }

            // Step 3.3: Create new validated journal entry lines
            const jvLinesWithRecordId = jvValidation.jvLines.map(line => ({
              ...line,
              recordId: id,
              recordType: recordType,
              id: null
            }));

            console.log('🔄 [PurchaseForm Edit] Creating new validated JV lines:', jvLinesWithRecordId);
            await processJournal(jvLinesWithRecordId, 'new', id, recordType);
          }
        }

        // Stage 3.5: Handle VendorCredit payment lines updates
        if (recordType === 'VendorCredit' && vendorCreditPaymentLineData && vendorCreditPaymentLineData.vendorBills?.length > 0) {
          const checkedVendorBills = vendorCreditPaymentLineData.vendorBills.filter(vendorBill => vendorBill.checked) || [];
          if (checkedVendorBills.length > 0) {
            const paymentLineItems = checkedVendorBills;
            await updateVendorCreditTransactionLineItems(paymentLineItems);

            // Update vendor bill amounts for edit mode
            const originalPaymentData = vendorCreditPaymentLineData.originalData || {};
            await updateVendorCreditRecordAmountsEditMode(vendorCreditPaymentLineData, originalPaymentData);
          }
        }

        // Stage 4: Auto-update parent record status to "Closed" if fully received/invoiced (for updates)
        await updateParentRecordStatusIfComplete(recordType, standardData);

        showNotification(`${recordType} updated successfully with ${customFieldCount} custom fields`, 'success');
      }

      // Clear sessionStorage after successful submission - only for new mode like SalesForm
      if (recordType === 'ItemReceipt' && mode === 'new') {
        sessionStorage.removeItem('purchaseOrderDataForReceiving');
      }
      if (recordType === 'VendorBill' && mode === 'new') {
        sessionStorage.removeItem('itemReceiptDataForBilling');
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

      // Step 0: Delete JV lines first (skip for PurchaseOrder)
      if (recordType !== 'PurchaseOrder') {
        try {
          await processJournal([], 'delete', id, recordType);
        } catch (error) {
          console.error('Error deleting JV lines:', error);
          // Continue with deletion - don't fail the entire process
        }
      }

      // Use the same dynamic configuration as other functions
      const transactionConfig = {
        PurchaseOrder: {
          endpoint: `${apiConfig.baseURL}/purchase-order-line`,
          getEndpoint: `${apiConfig.baseURL}/purchase-order-line/by-purchase-order/${id}`,
          idField: 'poid',
          quantityField: 'quantity'
        },
        ItemReceipt: {
          endpoint: `${apiConfig.baseURL}/item-receipt-line`,
          getEndpoint: `${apiConfig.baseURL}/item-receipt-line/by-item-receipt/${id}`,
          idField: 'irid',
          quantityField: 'quantity'
        },
        VendorBill: {
          endpoint: `${apiConfig.baseURL}/vendor-bill-line`,
          getEndpoint: `${apiConfig.baseURL}/vendor-bill-line/by-vendor-bill/${id}`,
          idField: 'vbid',
          quantityField: 'quantity'
        },
        VendorCredit: {
          endpoint: `${apiConfig.baseURL}/vendor-credit-line`,
          getEndpoint: `${apiConfig.baseURL}/vendor-credit-line/by-vendor-credit/${id}`,
          idField: 'vcid',
          quantityField: 'quantity'
        }
      };

      // For VendorCredit: Reverse applied amounts first, then delete payment lines
      if (recordType === 'VendorCredit') {
        try {
          // Step 1: Load existing payment lines and reverse applied amounts BEFORE deleting them
          const existingPaymentLines = await loadVendorCreditPaymentLines(id);
          console.log('🔄 Existing payment lines:111111111111111', existingPaymentLines);
          if (existingPaymentLines.length > 0) {
            // Create a structure similar to vendorCreditPaymentLineData for reversal
            const reversePaymentData = {
              vendorBills: existingPaymentLines.map(line => ({
                id: line.recordID,
                type: line.recordType || 'VendorBill',
                displayAmount: line.paymentAmount || 0,
                checked: true
              }))
            };

            // Reverse the amounts first
            await updateAppliedVendorBillAmounts(reversePaymentData, 'delete');
          }

          // Step 2: Now delete Vendor Credit Payment Lines
          await deleteVendorCreditPaymentLines(id);
        } catch (error) {
          console.error('Error handling VendorCredit payment lines during deletion:', error);
          // Continue with deletion - don't fail the entire process
        }
      }

      const config = transactionConfig[recordType];

      // For records with line items, delete line items
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

        if (existingItems.length > 0) {

          // For ItemReceipt: Reverse PurchaseOrderLine quantities and inventory before deleting
          if (recordType === 'ItemReceipt') {
            await updatePurchaseOrderLineQuantities([], true, existingItems);

            // Reverse inventory changes (BULK - subtract quantities from location)
            if (selectedLocation && existingItems.length > 0) {
              try {
                const locationId = selectedLocation?.value || selectedLocation;

                console.log(`🔄 Bulk reversing inventory for ${existingItems.length} deleted receipt items`);

                // Collect all inventory updates
                const inventoryUpdates = [];
                for (const item of existingItems) {
                  const itemId = item.itemID || item.itemId;
                  const quantity = parseFloat(item.quantity || 0);

                  if (itemId && locationId && quantity !== 0) {
                    // Check current inventory
                    const inventoryDetail = await checkInventoryDetailExists(itemId, locationId);
                    if (inventoryDetail) {
                      const currentQty = Number(inventoryDetail.quantityAvailable || 0);
                      const newQty = currentQty - quantity; // Subtract the quantity

                      inventoryUpdates.push({
                        itemId: itemId,
                        locationId: locationId,
                        quantity: newQty
                      });

                      console.log(`Prepared reversal for deleted item ${itemId}: ${currentQty} → ${newQty}`);
                    }
                  }
                }

                // Execute bulk update
                if (inventoryUpdates.length > 0) {
                  await bulkSetInventoryQuantity(inventoryUpdates);
                  console.log(`✅ Bulk reversed inventory for ${inventoryUpdates.length} deleted receipt items`);
                }
              } catch (inventoryError) {
                console.error(`❌ Failed to bulk reverse inventory for deleted receipt items:`, inventoryError.message);
                // Don't throw here - we want the deletion to succeed even if inventory update fails
              }
            }
          }

          // Update ItemReceiptLine InvoicedQty for VendorBill before deleting
          if (recordType === 'VendorBill') {
            await updateItemReceiptLineQuantities([], true, existingItems);
          }

          // Update parent record status to "Open" when deleting child records
          if (recordType === 'ItemReceipt') {
            // Update PurchaseOrder status to "Open" if purchaseOrderId is available
            const purchaseOrderId = formData.poid || formData.purchaseOrderId;
            if (purchaseOrderId) {
              try {
                console.log(`[Status Update] Setting PurchaseOrder ${purchaseOrderId} status to Open`);
                const statusUpdateResponse = await fetch(`${apiConfig.baseURL}/purchase-order/${purchaseOrderId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    status: status["Open"]
                  })
                });

                if (statusUpdateResponse.ok) {
                  console.log(`✅ PurchaseOrder ${purchaseOrderId} status updated to Open`);
                } else {
                  console.warn(`Failed to update PurchaseOrder ${purchaseOrderId} status:`, statusUpdateResponse.status);
                }
              } catch (error) {
                console.error(`Error updating PurchaseOrder ${purchaseOrderId} status:`, error);
              }
            }
          } else if (recordType === 'VendorBill') {
            // Update ItemReceipt status to "Open" if itemReceiptId is available
            const itemReceiptId = formData.irid || formData.itemReceiptId;
            if (itemReceiptId) {
              try {
                console.log(`[Status Update] Setting ItemReceipt ${itemReceiptId} status to Open`);
                const statusUpdateResponse = await fetch(`${apiConfig.baseURL}/item-receipt/${itemReceiptId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    status: status["Open"]
                  })
                });

                if (statusUpdateResponse.ok) {
                  console.log(`✅ ItemReceipt ${itemReceiptId} status updated to Open`);
                } else {
                  console.warn(`Failed to update ItemReceipt ${itemReceiptId} status:`, statusUpdateResponse.status);
                }
              } catch (error) {
                console.error(`Error updating ItemReceipt ${itemReceiptId} status:`, error);
              }
            }
          }

          // Delete all line items using bulk DELETE
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
        case 'PurchaseOrder':
          deleteMethod = transactionHook.deletePurchaseOrder;
          break;
        case 'ItemReceipt':
          deleteMethod = transactionHook.deleteItemReceipt;
          break;
        case 'VendorBill':
          deleteMethod = transactionHook.deleteVendorBill;
          break;
        case 'VendorCredit':
          deleteMethod = transactionHook.deleteVendorCredit;
          break;
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }

      if (!deleteMethod) {
        throw new Error(`Delete method not available for ${recordType}`);
      }

      await deleteMethod(id);

      // Delete custom field values
      const typeOfRecordId = getTypeOfRecordId();
      await deleteCustomFieldValues(id, typeOfRecordId);

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

  // Memoize dropdown data transformation to prevent infinite loops
  const memoizedDropdownData = useMemo(() => {
    const transformedData = {};

    Object.keys(dropdownData).forEach(fieldName => {
      const options = dropdownData[fieldName] || [];

      transformedData[fieldName] = options.map(item => {
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
          } else if (item.poNumber) {
            displayText = item.poNumber;
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
    });

    return transformedData;
  }, [dropdownData]);

  const getDropdownProps = useCallback((fieldRenderProps) => {
    const { name: fieldName, onChange, value } = fieldRenderProps;
    const transformedOptions = memoizedDropdownData[fieldName] || [];

    const optionsWithEmpty = [{ text: '-- Select --', value: null }, ...transformedOptions];
    const selectedOption = (value !== null && value !== undefined && value !== '') ?
      optionsWithEmpty.find(option => option.value === value) : optionsWithEmpty[0];

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
        const valueToPass = (selectedValue === '' || selectedValue === undefined) ? null : selectedValue;
        if (onChange) onChange({ target: { value: valueToPass } });

        if (fieldName === 'form') {
          await handleFormSelection(valueToPass);
        }

        // Handle POID changes for ItemReceipt auto-population
        if (fieldName === 'poid' && recordType === 'ItemReceipt' && mode === 'new') {
          // Track POID changes to trigger clearing and repopulation
          if (valueToPass !== currentPoid) {
            setCurrentPoid(valueToPass);
            setPoidChangeCounter(prev => prev + 1);
          }
        }
        if (fieldName === 'locationID') {
          setSelectedLocation(valueToPass);
        }
      }
    };
  }, [memoizedDropdownData, handleFormSelection, setSelectedLocation, currentPoid]);

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

  const renderSingleField = useCallback((field, isCustom, isFullWidth = false, customKey = null, formRenderProps = null) => {
    const fieldName = isCustom ? `custom_${field.fieldName || field.name}` : field.name;
    const fieldId = isCustom ? field.fieldName || field.name : field.name;
    const key = customKey || `${isCustom ? 'custom' : 'standard'}-field-${field.id || fieldId}`;

    // Hide discount field for all purchase transactions
    if (!isCustom && (field.name === 'discount' || fieldId === 'discount')) {
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

      <div className="master-form-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2>
            {mode === 'new' ? `Create New ${recordType}` :
              mode === 'edit' ? `Edit ${recordType}` : `View ${recordType}`}
          </h2>
          {/* Status badge in header for edit/view mode */}
          {(mode === 'edit' || mode === 'view') &&
            formData.status && (() => {
              // Get status name from dropdown data
              const statusData = dropdownData.status || [];
              const currentStatus = statusData.find(s => s.id === formData.status);
              const statusName = currentStatus?.name || 'Unknown';

              // Define status colors
              const getStatusColor = (name) => {
                switch (name.toLowerCase()) {
                  case 'open': return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' };
                  case 'closed': return { bg: '#D1FAE5', text: '#065F46', border: '#10B981' };
                  default: return { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
                }
              };

              const colors = getStatusColor(statusName);

              return (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '12px',
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
            onClick={() => navigate(navigationPaths[recordType] || '/purchase-order')}
            className="k-button k-button-secondary"
          >
            <FaTimes /> {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>

          {/* Receive Button - only for PurchaseOrder in view mode with Open status */}
          {recordType === 'PurchaseOrder' && mode === 'view' && formData.status === '5e3f19d1-f615-4954-88cb-30975d52b8cd' && (
            <Button
              type="button"
              onClick={handleReceive}
              className="k-button k-button-success"
            >
              <FaTruck /> Receive
            </Button>
          )}
          {/* Bill Button - only for ItemReceipt in view mode with Open status */}
          {recordType === 'ItemReceipt' && mode === 'view' && formData.status === '5e3f19d1-f615-4954-88cb-30975d52b8cd' && (
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

      {/* Enhanced Total and Amount Due Display - for VendorBill and VendorCredit */}
      {(recordType === 'VendorBill' || recordType === 'VendorCredit') && (
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
                {recordType === 'VendorCredit'
                  ? (formData?.totalAmount?.toFixed(2) || '0.00')
                  : (itemsTotalAmount?.toFixed(2) || '0.00')
                }
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
                {recordType === 'VendorCredit' ? 'UnApplied' : 'Amount Due'}
              </div>
              <div style={{
                fontSize: '18px',
                color: recordType === 'VendorCredit' ? '#27ae60' : '#e74c3c',
                fontWeight: '700',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {recordType === 'VendorCredit'
                  ? (formData?.unApplied?.toFixed(2) || '0.00')
                  : (formData?.amountDue?.toFixed(2) || itemsTotalAmount?.toFixed(2) || '0.00')
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

                  {/* Transaction Items Section with Tabs */}
                  <div className="form-section" style={{ padding: 0 }}>
                    {/* Show tabs for all modes (except PurchaseOrder) */}
                    {recordType !== 'PurchaseOrder' ? (
                      <>
                        <div className="purchase-tabs">
                          <button
                            className={`purchase-tab ${activeTab === 'items' ? 'active' : ''}`}
                            onClick={() => setActiveTab('items')}
                          >
                            <FaBoxes /> Items
                          </button>
                          {mode !== 'new' && (recordType === 'VendorBill' || recordType === 'VendorCredit') && (
                            <button
                              className={`purchase-tab ${activeTab === 'transactions' ? 'active' : ''}`}
                              onClick={() => setActiveTab('transactions')}
                            >
                              <FaExchangeAlt /> Payments
                            </button>
                          )}
                          <button
                            className={`purchase-tab ${activeTab === 'glImpact' ? 'active' : ''}`}
                            onClick={() => setActiveTab('glImpact')}
                          >
                            <FaChartBar /> GL Impact
                          </button>
                        </div>

                        <div className="purchase-tab-content" style={{ display: activeTab === 'items' ? 'block' : 'none' }}>
                          <PurchaseItems
                            recordType={recordType}
                            mode={mode}
                            embedded={true}
                            onTotalAmountChange={setItemsTotalAmount}
                            headerDiscount={formRenderProps.valueGetter('discount') || 0}
                            selectedLocation={selectedLocation}
                            poid={recordType === 'ItemReceipt' ? (mode === 'new' ? formRenderProps.valueGetter('purchaseOrderId') || formRenderProps.valueGetter('poid') || formRenderProps.valueGetter('purchaseOrder') : formData.poid || formData.purchaseOrderId || formData.purchaseOrder || (formData.items && formData.items.length > 0 && formData.items[0].poid)) : (mode === 'new' ? id : null)}
                            irid={recordType === 'VendorBill' ? (mode === 'new' ? formRenderProps.valueGetter('itemReceiptId') || formRenderProps.valueGetter('irid') || formRenderProps.valueGetter('itemReceipt') : formData.irid || formData.itemReceiptId) : (mode === 'new' ? id : null)}
                            vendorId={recordType === 'VendorCredit' ? (formRenderProps.valueGetter('vendorID') || formRenderProps.valueGetter('vendorId') || formRenderProps.valueGetter('vendor') || formData.vendorID || formData.vendorId) : null}
                            vendorCreditTotalAmount={recordType === 'VendorCredit' ? (itemsTotalAmount || formRenderProps.valueGetter('totalAmount') || 0) : 0}
                            onCreditApplicationChange={recordType === 'VendorCredit' ? handleVendorCreditApplicationChange : null}
                            poidChangeCounter={poidChangeCounter}
                            originalRecordLineItems={originalRecordLineItems}
                          />
                        </div>

                        <div className="purchase-tab-content" style={{ display: activeTab === 'transactions' ? 'block' : 'none' }}>
                          {renderTransactionsTable()}
                        </div>

                        <div className="purchase-tab-content" style={{ display: activeTab === 'glImpact' ? 'block' : 'none' }}>
                          {renderGLImpactTable()}
                        </div>
                      </>
                    ) : (
                      /* Regular Items section for non-view modes or other record types */
                      <>
                        <div className="section-header">
                          <h3 className="section-title">Items</h3>
                        </div>
                        <div style={{ padding: '0', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                          <PurchaseItems
                            recordType={recordType}
                            mode={mode}
                            embedded={true}
                            onTotalAmountChange={setItemsTotalAmount}
                            headerDiscount={formRenderProps.valueGetter('discount') || 0}
                            selectedLocation={selectedLocation}
                            poid={recordType === 'ItemReceipt' ? (mode === 'new' ? formRenderProps.valueGetter('purchaseOrderId') || formRenderProps.valueGetter('poid') || formRenderProps.valueGetter('purchaseOrder') : formData.poid || formData.purchaseOrderId || formData.purchaseOrder || (formData.items && formData.items.length > 0 && formData.items[0].poid)) : (mode === 'new' ? id : null)}
                            irid={recordType === 'VendorBill' ? (mode === 'new' ? formRenderProps.valueGetter('itemReceiptId') || formRenderProps.valueGetter('irid') || formRenderProps.valueGetter('itemReceipt') : formData.irid || formData.itemReceiptId) : (mode === 'new' ? id : null)}
                            vendorId={recordType === 'VendorCredit' ? (formRenderProps.valueGetter('vendorID') || formRenderProps.valueGetter('vendorId') || formRenderProps.valueGetter('vendor') || formData.vendorID || formData.vendorId) : null}
                            vendorCreditTotalAmount={recordType === 'VendorCredit' ? (itemsTotalAmount || formRenderProps.valueGetter('totalAmount') || 0) : 0}
                            onCreditApplicationChange={recordType === 'VendorCredit' ? handleVendorCreditApplicationChange : null}
                            poidChangeCounter={poidChangeCounter}
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
                    onClick={() => navigate(navigationPaths[recordType] || '/purchase-order')}
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
                      disabled={loading || (() => {
                        // Always allow VendorCredit submission
                        if (recordType === 'VendorCredit') return false;

                        // Allow ItemReceipt submission when it has pre-populated data from PurchaseOrder
                        if (recordType === 'ItemReceipt' && mode === 'new') {
                          const hasSessionData = sessionStorage.getItem('purchaseOrderDataForReceiving');
                          if (hasSessionData) return false;
                        }

                        // Allow VendorBill submission when it has pre-populated data from ItemReceipt
                        if (recordType === 'VendorBill' && mode === 'new') {
                          const hasSessionData = sessionStorage.getItem('itemReceiptDataForBilling');
                          if (hasSessionData) return false;
                        }

                        // Default behavior for other cases
                        return !formRenderProps.allowSubmit;
                      })()}
                      className="k-button k-button-primary"
                      onClick={(e) => {

                        // Force form submission for records with pre-populated data
                        const shouldForceSubmission = (() => {
                          if (recordType === 'ItemReceipt' && mode === 'new') {
                            const hasSessionData = sessionStorage.getItem('purchaseOrderDataForReceiving');
                            return hasSessionData;
                          }
                          if (recordType === 'VendorBill' && mode === 'new') {
                            const hasSessionData = sessionStorage.getItem('itemReceiptDataForBilling');
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

export const PurchaseOrderForm = (props) => <PurchaseForm {...props} recordType="PurchaseOrder" />;
export const ItemReceiptForm = (props) => <PurchaseForm {...props} recordType="ItemReceipt" />;
export const VendorBillForm = (props) => <PurchaseForm {...props} recordType="VendorBill" />;

export default PurchaseForm; 