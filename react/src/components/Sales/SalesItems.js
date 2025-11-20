import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { apiConfig, buildUrl } from '../../config/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Field, FormElement, FieldArray } from '@progress/kendo-react-form';
import { Input, TextArea, NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
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
import cleanPayload from '../../utils/cleanPayload';
import CreditMemoApplyTab from './components/CreditMemoApplyTab';
import ApplyTabSwitcher from '../../shared/components/ApplyTabSwitcher';
import '../../shared/styles/DynamicFormCSS.css';

// Create React Context for editing
const ItemGridEditContext = React.createContext({});
const ITEM_DATA_INDEX = 'itemDataIndex';
const DATA_ITEM_KEY = 'id';

const SalesItems = React.memo(({
  recordType,
  mode = 'new',
  embedded = false,
  onTotalAmountChange,
  headerDiscount = 0,
  selectedLocation,
  soid = null,
  dnid = null,
  onUnfulfilledLinesLoaded = null,
  customerId = null,
  onCreditApplicationChange = null,
  originalRecordLineItems = [],
  creditMemoTotalAmount = 0
}) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { fetchFormConfiguration } = useDynamicForm();
  const { getProductSalesPriceTaxCode } = useInventoryDetail();

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [dropdownData, setDropdownData] = useState({});
  const [formInitialized, setFormInitialized] = useState(false);
  const [unfulfilledItems, setUnfulfilledItems] = useState([]);
  const [unfulfilledLoading, setUnfulfilledLoading] = useState(false);
  const [uninvoicedItems, setUninvoicedItems] = useState([]);
  const [uninvoicedLoading, setUninvoicedLoading] = useState(false);
  // Store raw/original sales order lines (without modifications) for RemQty calculation
  const [rawSalesOrderLines, setRawSalesOrderLines] = useState([]);
  // Store raw/original item fulfillment lines (without modifications) for RemQty calculation
  const [rawItemFulfillmentLines, setRawItemFulfillmentLines] = useState([]);

  // Track if items were loaded from sessionStorage (for Invoice from ItemFulfillment)
  const itemsLoadedFromSessionStorage = useRef(false);
  // Track which items have been initialized to prevent re-setting their quantities
  const initializedItemsRef = useRef(new Set());

  // Credit Memo Apply functionality states
  const [itemsActiveTab, setItemsActiveTab] = useState('items');
  const handleItemsTabChange = useCallback((nextTab) => {
    setItemsActiveTab(nextTab);
  }, []);

  // Listen for parent form tab changes to reset SalesItems tab
  useEffect(() => {
    const handleResetTab = () => {
      setItemsActiveTab('items');
    };

    window.addEventListener('resetSalesItemsTab', handleResetTab);

    return () => {
      window.removeEventListener('resetSalesItemsTab', handleResetTab);
    };
  }, []);

  // Targeted cleanup - hide GL Impact content only in Apply tab, restore it otherwise
  useEffect(() => {
    if (recordType === 'CreditMemo') {
      const interval = setInterval(() => {
        const glTables = document.querySelectorAll('table');

        glTables.forEach(table => {
          const headers = table.querySelectorAll('th');
          const headerTexts = Array.from(headers).map(th => th.textContent?.trim().toLowerCase());

          // Check if this is a GL Impact table
          const isGLImpactTable = headerTexts.includes('account name') &&
                                  headerTexts.includes('debit') &&
                                  headerTexts.includes('credit') &&
                                  headerTexts.includes('memo');

          if (isGLImpactTable) {
            // Skip our own invoice/debit memo table in Apply tab
            if (table.closest('.apply-invoice-tab-container')) return;

            if (itemsActiveTab === 'apply') {
              // Hide GL Impact content when in Apply tab
              table.style.display = 'none';
              if (table.parentElement && table.parentElement.classList.contains('transactions-section')) {
                table.parentElement.style.display = 'none';
              }
            } else {
              // Restore GL Impact content when not in Apply tab
              table.style.display = '';
              if (table.parentElement && table.parentElement.classList.contains('transactions-section')) {
                table.parentElement.style.display = '';
              }
            }
          }
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [itemsActiveTab, recordType]);
  const [creditAmountStr, setCreditAmountStr] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [appliedTo, setAppliedTo] = useState(0);
  const [unapplied, setUnapplied] = useState(0);
  const [creditLoading, setCreditLoading] = useState(false);
  // const [creditError, setCreditError] = useState(null);
  const lockSeqRef = useRef(1);
  const editCtxRef = useRef(new Map());
  const isInitialLoadRef = useRef(true);
  const originalPaymentLinesRef = useRef(null);
  const creditMemoAutoSyncRef = useRef(false);
  const autoPopulateRunningRef = useRef(false);

  // Transaction items navigation
  const navigationPaths = {
    SalesOrder: '/sales-order',
    ItemFulfillment: '/item-fulfillment',
    Invoice: '/invoice'
  };

  // Get transaction-specific item configurations - matching exact field names from existing forms
  const getItemConfiguration = useCallback((transactionType) => {
    switch (transactionType) {
      case 'SalesOrder':
        return {
          title: 'Items',
          fields: ['itemID', 'quantity', 'fulFillQty', 'rate', 'taxID', 'taxPercent', 'taxAmount', 'totalAmount']
        };

      case 'ItemFulfillment':
        return {
          title: 'Items',
          fields: ['itemID', 'quantity', 'remQty', 'invoicedQty', 'rate', 'taxID', 'taxPercent', 'taxAmount', 'totalAmount']
        };

      case 'Invoice':
        return {
          title: 'Items',
          fields: ['itemID', 'itemFulfillmentLineId', 'quantityDelivered', 'rate', 'taxID', 'taxPercent', 'taxRate', 'totalAmount']
        };

      case 'CreditMemo':
        return {
          title: 'Items',
          fields: ['itemID', 'quantity', 'rate', 'taxID', 'taxPercent', 'taxAmount', 'totalAmount']
        };

      default:
        return {
          title: 'Items',
          fields: ['itemID', 'quantity', 'rate', 'taxID', 'taxPercent', 'taxAmount', 'totalAmount']
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
      return Array.isArray(data) ? data : (data.results || []);
    } catch (err) {
      if (err.name === 'AbortError') {
        return [];
      }
      return [];
    }
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  }, []);

  // Credit Memo Apply functionality - copied from PaymentLine.js
  const parseAmount = (v) => {
    const n = parseFloat(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

  // Build initial rows from API data (oldest-first)
  const buildInitialInvoices = (invoiceData = [], debitMemoData = []) => {
    // Process invoices
    const processedInvoices = invoiceData
      .filter(inv => {
        // Only show open status invoices (amountDue > 0)
        const amountDue = parseAmount(inv.amountDue);
        return amountDue > 0;
      })
      .map((inv) => {
        // Convert API date format (2025-08-25T00:00:00) to DD/MM/YYYY
        const apiDate = new Date(inv.invoiceDate);
        const formattedDate = `${apiDate.getDate().toString().padStart(2, '0')}/${(apiDate.getMonth() + 1).toString().padStart(2, '0')}/${apiDate.getFullYear()}`;

        return {
          id: inv.id,
          date: formattedDate,
          dateKey: apiDate.getTime(),
          type: "Invoice",
          refNo: inv.sequenceNumber,
          dueAmount: parseAmount(inv.amountDue),
          originalAmount: parseAmount(inv.totalAmount),
          displayAmount: 0,
          checked: false,
          userTyped: false,
          lockedSeq: null,
          disabled: false,
        };
      });

    // Process debit memos
    const processedDebitMemos = debitMemoData
      .filter(dm => {
        // Only show open status debit memos (amountDue > 0)
        const amountDue = parseAmount(dm.amountDue || dm.totalAmount);
        return amountDue > 0;
      })
      .map((dm) => {
        const apiDate = new Date(dm.tranDate);
        const formattedDate = `${apiDate.getDate().toString().padStart(2, '0')}/${(apiDate.getMonth() + 1).toString().padStart(2, '0')}/${apiDate.getFullYear()}`;

        return {
          id: dm.id,
          date: formattedDate,
          dateKey: apiDate.getTime(),
          type: "Debit Memo",
          refNo: dm.sequenceNumber,
          dueAmount: parseAmount(dm.amountDue || dm.totalAmount),
          originalAmount: parseAmount(dm.totalAmount),
          displayAmount: 0,
          checked: false,
          userTyped: false,
          lockedSeq: null,
          disabled: false,
        };
      });

    // Combine and sort by date (oldest first)
    return [...processedInvoices, ...processedDebitMemos]
      .sort((a, b) => a.dateKey - b.dateKey);
  };

  // Fetch invoices from API
  const fetchInvoices = useCallback(async (customerIdParam, locationIdParam) => {
    console.log('🔍 fetchInvoices called with:', { customerIdParam, locationIdParam });

    // Require BOTH customer AND location
    if (!customerIdParam || !locationIdParam) {
      console.log('❌ fetchInvoices: Missing required parameters, returning empty array');
      return [];
    }

    try {
      const url = buildUrl(apiConfig.endpoints.invoiceByCustomerAndLocation(customerIdParam, locationIdParam));
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Handle both new format (direct array) and old format (results property)
      return Array.isArray(data) ? data : (data.results || []);
    } catch (err) {
      throw err;
    }
  }, []);

  // Fetch debit memos from API
  const fetchDebitMemos = useCallback(async (customerIdParam, locationIdParam) => {
    console.log('🔍 fetchDebitMemos called with:', { customerIdParam, locationIdParam });

    // Require BOTH customer AND location
    if (!customerIdParam || !locationIdParam) {
      console.log('❌ fetchDebitMemos: Missing required parameters, returning empty array');
      return [];
    }

    try {
      const url = buildUrl(apiConfig.endpoints.debitMemoByCustomerAndLocation(customerIdParam, locationIdParam));
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Handle both new format (direct array) and old format (results property)
      return Array.isArray(data) ? data : (data.results || []);
    } catch (err) {
      throw err;
    }
  }, []);

  // Calculate credit amount from line items
  const calculateCreditAmount = useCallback(() => {
    const currentItems = formData.items || [];
    const totalAmount = currentItems.reduce((sum, item) => {
      const itemTotal = item.totalAmount || 0;
      return sum + itemTotal;
    }, 0);
    return totalAmount;
  }, [formData.items]);

  // Update credit amount when items change or when onTotalAmountChange is called

  // Handle total amount changes from the items grid
  const handleTotalAmountChange = useCallback((newTotal) => {

    // Only update if the value actually changed to prevent infinite loops

    if (recordType === 'CreditMemo') {
      const newCreditAmountStr = newTotal.toString();
      // Only update if the credit amount string actually changed
      if (creditAmountStr !== newCreditAmountStr) {
        setCreditAmountStr(newCreditAmountStr);
        // Only recalculate if we have invoices loaded
        if (invoices && invoices.length > 0) {
          recalc({ creditAmountStr: newCreditAmountStr });
        } else {
        }
      }
    }

    // Call parent callback if provided
    if (onTotalAmountChange) {
      onTotalAmountChange(newTotal);
    }
  }, [recordType, onTotalAmountChange, creditAmountStr, invoices]);

  // Update credit amount when items change - removed to prevent infinite loop
  // The credit amount is now updated via handleTotalAmountChange callback

  // Send credit application data to parent component
  useEffect(() => {
    if (onCreditApplicationChange && recordType === 'CreditMemo') {
      const creditData = {
        creditAmount: creditAmountStr,
        invoices: invoices,
        appliedTo: appliedTo,
        unapplied: unapplied,
        originalData: originalPaymentLinesRef.current // Include original data for edit mode calculations
      };
      onCreditApplicationChange(creditData);
    }
  }, [creditAmountStr, invoices, appliedTo, unapplied, onCreditApplicationChange, recordType]);

  // Fetch Credit Memo Payment Lines for edit/view modes
  const fetchCreditMemoPaymentLines = useCallback(async (creditMemoId) => {
    try {
      const response = await fetch(`${apiConfig.baseURL}/credit-memo-payment-line/by-credit-memo/${creditMemoId}`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const paymentLines = Array.isArray(data) ? data : data.lines || data.results || [];
        return paymentLines;
      }
      return [];
    } catch (error) {
      console.error('Error fetching credit memo payment lines:', error);
      return [];
    }
  }, []);

  // Build initial invoices with payment line data for edit/view modes
  const buildInitialInvoicesWithPaymentData = useCallback(async (invoiceData = [], debitMemoData = [], paymentLines = []) => {
    // Create a map for quick lookup of payment lines by recordID

    const paymentLineMap = new Map();
    paymentLines.forEach(line => paymentLineMap.set(line.recordID, line));

    // Helper function to process a single invoice
    const processInvoice = (inv, paymentLine) => {
      const apiDate = new Date(inv.invoiceDate);
      const formattedDate = `${apiDate.getDate().toString().padStart(2, '0')}/${(apiDate.getMonth() + 1).toString().padStart(2, '0')}/${apiDate.getFullYear()}`;

      return {
        id: inv.id,
        date: formattedDate,
        dateKey: apiDate.getTime(),
        type: "Invoice",
        refNo: inv.sequenceNumber,
        dueAmount: parseAmount(inv.amountDue),
        originalAmount: parseAmount(inv.totalAmount),
        // Payment line data
        displayAmount: paymentLine ? paymentLine.paymentAmount : 0,
        originalDisplayAmount: paymentLine ? paymentLine.paymentAmount : 0,
        checked: paymentLine ? paymentLine.isApplied : false,
        userTyped: !!paymentLine,
        lockedSeq: null,
        disabled: mode === 'view'
      };
    };

    // Helper function to process a single debit memo
    const processDebitMemo = (dm, paymentLine) => {
      const apiDate = new Date(dm.tranDate);
      const formattedDate = `${apiDate.getDate().toString().padStart(2, '0')}/${(apiDate.getMonth() + 1).toString().padStart(2, '0')}/${apiDate.getFullYear()}`;

      return {
        id: dm.id,
        date: formattedDate,
        dateKey: apiDate.getTime(),
        type: "Debit Memo",
        refNo: dm.sequenceNumber,
        dueAmount: parseAmount(dm.amountDue || dm.totalAmount),
        originalAmount: parseAmount(dm.totalAmount),
        // Payment line data
        displayAmount: paymentLine ? paymentLine.paymentAmount : 0,
        originalDisplayAmount: paymentLine ? paymentLine.paymentAmount : 0,
        checked: paymentLine ? paymentLine.isApplied : false,
        userTyped: !!paymentLine,
        lockedSeq: null,
        disabled: mode === 'view'
      };
    };

    // Process existing invoices from invoiceData (Open invoices)
    const processedInvoices = invoiceData.map((inv) => {
      const paymentLine = paymentLineMap.get(inv.id);
      return processInvoice(inv, paymentLine);
    });

    // Process existing debit memos from debitMemoData (Open debit memos)
    const processedDebitMemos = debitMemoData.map((dm) => {
      const paymentLine = paymentLineMap.get(dm.id);
      return processDebitMemo(dm, paymentLine);
    });

    // Create a set of record IDs that already exist in invoiceData and debitMemoData
    const existingRecordIds = new Set([
      ...invoiceData.map(inv => inv.id),
      ...debitMemoData.map(dm => dm.id)
    ]);

    // Fetch invoices/debit memos from payment lines that are NOT in existing data (closed/fully paid records)
    const additionalRecords = [];
    for (const paymentLine of paymentLines) {
      const recordID = paymentLine.recordID;
      const recordType = paymentLine.recordType;

      // Skip if this record already exists in the data
      if (existingRecordIds.has(recordID)) {
        continue;
      }

      try {
        // Fetch the invoice or debit memo by ID based on recordType
        let endpoint;
        let processor;

        if (recordType === 'Invoice') {
          endpoint = buildUrl(`/invoice/${recordID}`);
          processor = processInvoice;
        } else if (recordType === 'Debit Memo') {
          endpoint = buildUrl(`/debit-memo/${recordID}`);
          processor = processDebitMemo;
        } else {
          console.warn(`⚠️ Unknown recordType: ${recordType} for recordID: ${recordID}`);
          continue;
        }

        const response = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const record = await response.json();
          // Process this record with its payment line data
          const processedRecord = processor(record, paymentLine);
          additionalRecords.push(processedRecord);
          console.log(`✅ Fetched closed ${recordType} (ID: ${recordID}) from payment line`);
        } else {
          console.warn(`⚠️ Could not fetch ${recordType} with ID ${recordID}: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching ${recordType} with ID ${recordID}:`, error);
      }
    }

    // Merge processed records with additional records from payment lines
    let allInvoices = [...processedInvoices, ...processedDebitMemos, ...additionalRecords];

    // Sort by date (oldest first)
    allInvoices = allInvoices.sort((a, b) => a.dateKey - b.dateKey);

    // In view mode, show only applied records
    if (mode === 'view') {
      allInvoices = allInvoices.filter(inv => inv.checked && inv.displayAmount > 0);
    }

    return allInvoices;
  }, [mode]);

  // Fetch credit application data when customerId and location change
  useEffect(() => {
    const fetchCreditData = async () => {
      if (recordType !== 'CreditMemo') {
        setInvoices([]);
        return;
      }

      // Require BOTH customer AND location for Credit Memo
      if (!customerId || !selectedLocation) {
        console.log('⚠️ Credit Memo: Missing required parameters', {
          recordType,
          customerId,
          selectedLocation
        });
        setInvoices([]);
        return;
      }

      setCreditLoading(true);
      // setCreditError(null);

      try {
        const [invoiceData, debitMemoData] = await Promise.all([
          fetchInvoices(customerId, selectedLocation),
          fetchDebitMemos(customerId, selectedLocation)
        ]);

        let processedInvoices;

        // For edit/view modes, fetch payment lines and merge data
        if ((mode === 'edit' || mode === 'view') && id) {
          const paymentLines = await fetchCreditMemoPaymentLines(id);

          // Store original payment lines for edit mode difference calculations
          if (mode === 'edit') {
            originalPaymentLinesRef.current = { lines: paymentLines };
            console.log('Stored original payment lines for edit mode:', originalPaymentLinesRef.current);
          }

          processedInvoices = await buildInitialInvoicesWithPaymentData(invoiceData, debitMemoData, paymentLines);
        } else {
          // For new mode, use regular processing
          processedInvoices = buildInitialInvoices(invoiceData, debitMemoData);
        }

        // Mark as initial load to prevent auto-save
        isInitialLoadRef.current = true;
        setInvoices(processedInvoices);

      } catch (err) {
        console.error('❌ Error fetching credit data:', err);
        // setCreditError(err.message);
        setInvoices([]);
      } finally {
        setCreditLoading(false);
      }
    };

    fetchCreditData();
  }, [customerId, selectedLocation, recordType, mode, id, fetchInvoices, fetchDebitMemos, fetchCreditMemoPaymentLines, buildInitialInvoicesWithPaymentData]);


  // Get cash unapplied
  const getCashUnapplied = () => unapplied;

  const updateCheckboxDisabling = (nextInvoices, nextUnapplied) => {
    const capacity = nextUnapplied;

    return nextInvoices.map((row) => {
      const applied = row.displayAmount;
      const disabled = applied === 0 && capacity <= 0;
      return { ...row, disabled };
    });
  };

  // Core allocation engine (recalc)
  const recalc = (opt) => {
    const creditLimit = parseAmount(
      opt?.creditAmountStr ?? creditAmountStr
    );
    let cashAvail = creditLimit;

    const currInvoices = opt?.invoices ?? invoices;

    // If no invoices available, don't proceed with recalculation
    if (!currInvoices || currInvoices.length === 0) {
      return;
    }

    // Build invoice models
    const invModels = currInvoices.map((row) => {
      const typedOrder = row.userTyped ? row.lockedSeq ?? Infinity : Infinity;
      const currentDisplayed = row.displayAmount;

      // In edit mode, use enhanced limit (dueAmount + originalDisplayAmount) like PaymentLine.js
      const originalPayment = row.originalDisplayAmount || 0;
      const lineCap = mode === 'edit' && id
        ? row.dueAmount + originalPayment
        : row.dueAmount;

      const typedRequested = row.userTyped
        ? clamp(currentDisplayed, 0, lineCap)
        : 0;

      const stickyRequested =
        !row.userTyped && currentDisplayed > 0
          ? clamp(currentDisplayed, 0, lineCap)
          : 0;

      return {
        id: row.id,
        dateKey: row.dateKey,
        dueAmount: row.dueAmount,
        originalDisplayAmount: originalPayment,
        lineCap,
        checked: row.checked,
        userTyped: row.userTyped,
        typedOrder,
        typedRequested,
        stickyRequested,
        appliedCash: 0,
      };
    });

    // Phase A: honor typed rows (lock order, then oldest)
    const typedList = invModels
      .filter((r) => r.typedRequested > 0)
      .sort(
        (a, b) =>
          (a.typedOrder - b.typedOrder) || (a.dateKey - b.dateKey)
      );

    for (const inv of typedList) {
      let target = inv.typedRequested;

      const cashUsed = Math.min(target, cashAvail);
      inv.appliedCash += cashUsed;
      cashAvail -= cashUsed;
    }

    // Phase B: preserve existing non-typed ("sticky") oldest-first
    const stickyList = invModels
      .filter((r) => r.typedRequested === 0 && r.stickyRequested > 0)
      .sort((a, b) => a.dateKey - b.dateKey);

    console.log('Sticky allocation phase:', {
      stickyListLength: stickyList.length,
      stickyItems: stickyList.map(r => ({ id: r.id, stickyRequested: r.stickyRequested, checked: r.checked }))
    });

    for (const inv of stickyList) {
      const already = inv.appliedCash;
      let target = Math.max(inv.stickyRequested - already, 0);

      if (target <= 0) continue;

      const cashUsed = Math.min(target, cashAvail);
      inv.appliedCash += cashUsed;
      cashAvail -= cashUsed;

      console.log('Sticky applied:', { cashUsed, remainingCashAvail: cashAvail });
    }

    // Phase C: allocate remainder to newly-checked & empty (oldest-first)
    const autoList = invModels
      .filter(
        (r) =>
          r.typedRequested === 0 &&
          r.stickyRequested === 0 &&
          r.checked === true
      )
      .sort((a, b) => a.dateKey - b.dateKey);

    console.log('Auto allocation phase:', {
      autoListLength: autoList.length,
      autoItems: autoList.map(r => ({
        id: r.id,
        checked: r.checked,
        typedRequested: r.typedRequested,
        stickyRequested: r.stickyRequested,
        dueAmount: r.dueAmount,
        originalDisplayAmount: r.originalDisplayAmount
      })),
      cashAvailForAuto: cashAvail
    });

    for (const inv of autoList) {
      const already = inv.appliedCash;
      // In edit mode, allow applying up to the full due amount (not limited by original payment)
      // This ensures when checking a box, it applies the maximum possible amount
      const stillDue = Math.max(inv.dueAmount - already, 0);

      if (stillDue <= 0) continue;

      let target = stillDue;

      const cashUsed = Math.min(target, cashAvail);
      inv.appliedCash += cashUsed;
      cashAvail -= cashUsed;

      console.log('Applied cash:', { cashUsed, remainingCashAvail: cashAvail });
    }

    // Update invoices
    let totalAppliedToInvoices = 0;
    const nextInvoices = currInvoices.map((row) => {
      const m = invModels.find((x) => x.id === row.id);
      const total = m.appliedCash;
      totalAppliedToInvoices += total;
      return {
        ...row,
        displayAmount: total,
        checked: total > 0,
        appliedCash: m.appliedCash,
      };
    });

    // Totals
    const nextUnapplied = Math.max(creditLimit - totalAppliedToInvoices, 0);

    // Disable checkboxes if no capacity left and row has 0 applied
    const disabledInvoices = updateCheckboxDisabling(
      nextInvoices,
      nextUnapplied
    );

    // Commit state
    setInvoices(disabledInvoices);
    setAppliedTo(totalAppliedToInvoices);
    setUnapplied(nextUnapplied);
  };

  useEffect(() => {
    if (recordType !== 'CreditMemo') {
      creditMemoAutoSyncRef.current = false;
      return;
    }

    if (!invoices || invoices.length === 0) {
      creditMemoAutoSyncRef.current = false;
    }

    const normalizedAmount = parseAmount(creditMemoTotalAmount || 0).toString();

    if (creditAmountStr !== normalizedAmount) {
      setCreditAmountStr(normalizedAmount);
      creditMemoAutoSyncRef.current = false;

      if (invoices && invoices.length > 0) {
        recalc({ creditAmountStr: normalizedAmount, invoices });
        creditMemoAutoSyncRef.current = true;
      }
      return;
    }

    if ((mode === 'edit' || mode === 'view') &&
        invoices && invoices.length > 0 &&
        !creditMemoAutoSyncRef.current) {
      recalc({ invoices });
      creditMemoAutoSyncRef.current = true;
    }
  }, [
    recordType,
    creditMemoTotalAmount,
    creditAmountStr,
    invoices,
    mode
  ]);

  // Handlers
  const onCreditAmountChange = (e) => {
    const value = e.target ? e.target.value : (e.value?.toString() || '');
    setCreditAmountStr(value);
    recalc({ creditAmountStr: value });
  };

  const onClearAll = () => {
    const clearedInv = invoices.map((r) => ({
      ...r,
      displayAmount: 0,
      checked: false,
      userTyped: false,
      lockedSeq: null,
    }));
    setInvoices(clearedInv);
    setAppliedTo(0);
    setUnapplied(parseAmount(creditAmountStr));
  };

  const onHeaderInvToggle = () => {
    const allChecked = invoices.length > 0 && invoices.every((r) => r.checked);

    // Validate credit amount before allowing checkbox selection (only when checking)
    const creditAmount = parseAmount(creditAmountStr);
    if (!allChecked && (creditAmount === 0 || !creditAmountStr || creditAmountStr === '')) {
      alert('Please enter a Credit Amount before selecting transactions.');
      return;
    }

    const nextInvoices = invoices.map((r) => ({ ...r, checked: !allChecked, userTyped: false }));
    recalc({ invoices: nextInvoices });
  };

  const onInvCheckChange = (id, checked) => {
    // Validate credit amount before allowing checkbox selection (only when checking)
    const creditAmount = parseAmount(creditAmountStr);
    if (checked && (creditAmount === 0 || !creditAmountStr || creditAmountStr === '')) {
      alert('Please enter a Credit Amount before selecting transactions.');
      return;
    }

    const nextInvoices = invoices.map((r) => {
      if (r.id !== id) return r;

      if (!checked) {
        // When unchecking, clear the amount like PaymentLine.js
        return {
          ...r,
          checked: false,
          displayAmount: 0,
          userTyped: false
        };
      } else {
        // When checking, in edit mode we want to let recalc handle the allocation
        // Don't pre-set displayAmount so it goes through auto allocation phase
        return {
          ...r,
          checked: true,
          displayAmount: 0,  // Clear amount so it goes to auto allocation
          userTyped: false
        };
      }
    });

    // Prevent auto-save during user interaction by marking as initial load
    isInitialLoadRef.current = true;
    recalc({ invoices: nextInvoices });
  };

  const onInvApplyChange = (id, value) => {
    const nextInvoices = invoices.map((r) => {
      if (r.id === id) {
        const numVal = parseAmount(value);
        const isTyped = value !== '' && numVal >= 0;
        return {
          ...r,
          displayAmount: numVal,
          userTyped: isTyped,
          lockedSeq: isTyped ? lockSeqRef.current++ : null,
        };
      }
      return r;
    });

    // Prevent auto-save during user interaction by marking as initial load
    isInitialLoadRef.current = true;
    recalc({ invoices: nextInvoices });
  };

  const onInvApplyFocus = (id) => {
    const row = invoices.find((r) => r.id === id);
    if (row) {
      editCtxRef.current.set(id, {
        startCents: row.displayAmount,
        unappliedAtFocusCents: unapplied,
      });
    }
  };

  const onInvApplyBlur = (id) => {
    editCtxRef.current.delete(id);
  };

  // Create Credit Memo Payment Lines API calls
  const createCreditMemoPaymentLines = useCallback(async (creditMemoId, appliedInvoices) => {
    if (!creditMemoId || !appliedInvoices || appliedInvoices.length === 0) {
      return;
    }

    const createPromises = appliedInvoices
      .filter(invoice => invoice.checked && invoice.displayAmount > 0)
      .map(async (invoice) => {
        const paymentLineData = {
          paymentAmount: invoice.displayAmount,
          recordID: invoice.id,
          isApplied: true,
          refNo: invoice.refNo,
          recordType: invoice.type,
          cmid: creditMemoId,
          creditMemoSeqNum: null, // Will be set by backend
          mainRecordAmount: invoice.originalAmount
        };

        try {
          const response = await fetch(buildUrl('/credit-memo-payment-line'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(cleanPayload(paymentLineData))
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to create credit memo payment line: ${response.status} - ${errorData}`);
          }

          return await response.json();
        } catch (error) {
          console.error('Error creating credit memo payment line:', error);
          throw error;
        }
      });

    try {
      await Promise.all(createPromises);
      showNotification('Credit applications saved successfully', 'success');
    } catch (error) {
      showNotification(`Error saving credit applications: ${error.message}`, 'error');
      throw error;
    }
  }, [showNotification]);

  // Save credit applications
  const saveCreditApplications = useCallback(async () => {
    if (recordType !== 'CreditMemo' || !id) {
      return;
    }

    try {
      setCreditLoading(true);
      await createCreditMemoPaymentLines(id, invoices);
    } catch (error) {
      console.error('Error saving credit applications:', error);
    } finally {
      setCreditLoading(false);
    }
  }, [recordType, id, invoices, createCreditMemoPaymentLines]);

  // Removed auto-save credit applications - saveCreditApplications should only be called on submit button
  // Auto-save was causing unwanted saves when adding items or switching to Apply tab

  // Fetch uninvoiced ItemFulfillment lines for Invoice
  const normalizeIdList = useCallback((value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter(v => v !== null && v !== undefined && v !== '');
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.filter(Boolean);
          }
        } catch (err) {
          // Ignore JSON parse errors - fall back to comma or single value handling
        }
      }
      if (trimmed.includes(',')) {
        return trimmed.split(',').map(id => id.trim()).filter(Boolean);
      }
      return [trimmed];
    }
    return [value];
  }, []);

  const getIdSignature = useCallback((value) => {
    const ids = normalizeIdList(value);
    if (!ids.length) return null;
    return ids.slice().sort().join('|');
  }, [normalizeIdList]);

  // Fetch uninvoiced ItemFulfillment lines for Invoice
  const fetchUninvoicedItemFulfillmentLines = useCallback(async (itemFulfillmentId) => {
    if (recordType !== 'Invoice') {
      return [];
    }

    const fulfillmentIds = normalizeIdList(itemFulfillmentId);

    if (fulfillmentIds.length === 0) {
      setUninvoicedItems([]);
      setRawItemFulfillmentLines([]);
      return [];
    }

    try {
      setUninvoicedLoading(true);
      let combinedUninvoicedLines = [];
      let combinedRawLines = [];

      for (const fulfillmentId of fulfillmentIds) {
        const url = buildUrl(`/item-fulfilment-line/by-item-fulfilment/${fulfillmentId}`);
        console.log('[SalesItems] Fetching uninvoiced lines from:', url);

        const response = await fetch(url, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch uninvoiced item fulfillment lines: ${response.status}`);
        }

        const data = await response.json();
        let uninvoicedLines = Array.isArray(data) ? data : (data.lines || data.results || []);
        uninvoicedLines = uninvoicedLines.map(line => ({
          ...line,
          dnid: line.dnid || line.itemFulfillmentId || fulfillmentId,
          itemFulfillmentId: line.itemFulfillmentId || fulfillmentId,
          _parentItemFulfillmentId: fulfillmentId
        }));

        console.log('[SalesItems] Fetched uninvoiced lines from API:', uninvoicedLines);
        console.log('[SalesItems] ===== RAW IF LINES DETAIL =====');
        uninvoicedLines.forEach(line => {
          console.log(`[SalesItems] IF Line ${line.id}: parentDnId=${line.dnid}, itemID=${line.itemID}, qty=${line.quantity}, invoicedQty=${line.invoicedQty}, remaining=${(line.quantity || 0) - (line.invoicedQty || 0)}`);
        });

        combinedRawLines = combinedRawLines.concat(uninvoicedLines);
        combinedUninvoicedLines = combinedUninvoicedLines.concat(uninvoicedLines);
      }

      // Store the RAW item fulfillment lines for RemQty calculation (without any modifications)
      // CRITICAL: This must be stored BEFORE any edit mode modifications
      // The raw data is used to calculate the true remaining quantity from the database
      setRawItemFulfillmentLines(combinedRawLines);
      console.log('[SalesItems] ✅ Stored raw item fulfillment lines for RemQty. Count:', combinedRawLines.length);

      // In EDIT mode: Replace API data with record data where itemFulfillmentLineId matches
      // NOTE: This modifies uninvoicedLines for display, but rawItemFulfillmentLines stays unmodified for RemQty calculation
      if (mode === 'edit' && originalRecordLineItems && originalRecordLineItems.length > 0) {
        console.log('[SalesItems] EDIT MODE - Merging API data with record data for Invoice');
        console.log('[SalesItems] Original record line items:', originalRecordLineItems);

        combinedUninvoicedLines = combinedUninvoicedLines.map(apiLine => {
          // Find matching record line by itemFulfillmentLineId
          const recordLine = originalRecordLineItems.find(recLine =>
            recLine.itemFulfillmentLineId === apiLine.id
          );

          if (recordLine) {
            // REPLACE API data with RECORD data for this itemFulfillmentLineId
            console.log(`[SalesItems] ✅ Replacing API line ${apiLine.id} with RECORD data:`, recordLine);

            // Calculate invoicedQty correctly for EDIT MODE:
            // API's invoicedQty includes THIS record's contribution
            // To show remaining for THIS record, we need to subtract current record's qty from API invoicedQty
            // This gives us what's invoiced by OTHER records only
            const currentRecordQty = recordLine.quantityDelivered || recordLine.quantity || 0;
            const apiInvoicedQty = apiLine.invoicedQty || 0;
            const otherRecordsInvoicedQty = Math.max(0, apiInvoicedQty - currentRecordQty);

            console.log(`[SalesItems] Edit mode invoicedQty calculation for line ${apiLine.id}:`, {
              apiInvoicedQty,
              currentRecordQty,
              otherRecordsInvoicedQty,
              apiLineQty: apiLine.quantity
            });

            return {
              ...apiLine, // Keep API structure (id, itemID, etc.)
              quantity: recordLine.quantityDelivered || recordLine.quantity || apiLine.quantity, // Use record quantity
              rate: recordLine.rate || apiLine.rate,
              taxID: recordLine.taxID || apiLine.taxID,
              taxPercent: recordLine.taxPercent || apiLine.taxPercent,
              taxAmount: recordLine.taxAmount || apiLine.taxAmount,
              // invoicedQty = what OTHER records have invoiced (excluding current record)
              invoicedQty: otherRecordsInvoicedQty
            };
          }

          // No match - return API data as-is (this item is not in current record)
          return apiLine;
        });

        console.log('[SalesItems] Merged uninvoiced lines:', combinedUninvoicedLines);
      }

      setUninvoicedItems(combinedUninvoicedLines);
      return combinedUninvoicedLines;
    } catch (err) {
      console.error('Error fetching uninvoiced item fulfillment lines:', err);
      showNotification(`Error fetching uninvoiced lines: ${err.message}`, 'error');
      setUninvoicedItems([]);
      return [];
    } finally {
      setUninvoicedLoading(false);
    }
  }, [recordType, showNotification, mode, originalRecordLineItems, normalizeIdList]);
  // Fetch unfulfilled sales order lines for ItemFulfillment
  const fetchUnfulfilledSalesOrderLines = useCallback(async (salesOrderId) => {
    if (!salesOrderId || recordType !== 'ItemFulfillment') {
      return [];
    }

    try {
      setUnfulfilledLoading(true);
      const url = buildUrl(`/salesorderline/by-salesorder/${salesOrderId}`);
      console.log('[SalesItems] Fetching unfulfilled lines from:', url);

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unfulfilled sales order lines: ${response.status}`);
      }

      const data = await response.json();
      // Handle both new format (direct array) and old format (lines/results property)
      let unfulfilledLines = Array.isArray(data) ? data : (data.lines || data.results || []);
      console.log('[SalesItems] Fetched unfulfilled lines from API:', unfulfilledLines);

      // Store the RAW sales order lines for RemQty calculation (without any modifications)
      setRawSalesOrderLines(unfulfilledLines);
      console.log('[SalesItems] Stored raw sales order lines for RemQty:', unfulfilledLines);

      // In EDIT mode: Replace API data with record data where salesOrderLineId matches
      if (mode === 'edit' && originalRecordLineItems && originalRecordLineItems.length > 0) {
        console.log('[SalesItems] EDIT MODE - Merging API data with record data');
        console.log('[SalesItems] Original record line items:', originalRecordLineItems);

        unfulfilledLines = unfulfilledLines.map(apiLine => {
          // Find matching record line by salesOrderLineId
          const recordLine = originalRecordLineItems.find(recLine =>
            recLine.salesOrderLineId === apiLine.id
          );

          if (recordLine) {
            // REPLACE API data with RECORD data for this salesOrderLineId
            console.log(`[SalesItems] ✅ Replacing API line ${apiLine.id} with RECORD data:`, recordLine);

            // Calculate fulFillQty correctly:
            // API's fulFillQty includes THIS record's contribution
            // To show remaining for THIS record, we need: (API fulFillQty - record quantity)
            // But this gives us what's fulfilled by OTHER records
            // Then remaining = SO quantity - fulFillQty from other records
            const currentRecordQty = recordLine.quantity || 0;
            const apiFullfilledQty = apiLine.fulFillQty || 0;
            const otherRecordsFulfilledQty = Math.max(0, apiFullfilledQty - currentRecordQty);

            return {
              ...apiLine, // Keep API structure (id, itemID, etc.)
              quantity: recordLine.quantity || apiLine.quantity, // Use record quantity
              rate: recordLine.rate || apiLine.rate,
              taxID: recordLine.taxID || apiLine.taxID,
              taxPercent: recordLine.taxPercent || apiLine.taxPercent,
              taxAmount: recordLine.taxAmount || apiLine.taxAmount,
              // fulFillQty = what OTHER records have fulfilled (excluding current record)
              fulFillQty: otherRecordsFulfilledQty
            };
          }

          // No match - return API data as-is (this item is not in current record)
          return apiLine;
        });

        console.log('[SalesItems] Merged unfulfilled lines:', unfulfilledLines);
      }

      setUnfulfilledItems(unfulfilledLines);
      return unfulfilledLines;
    } catch (err) {
      console.error('Error fetching unfulfilled sales order lines:', err);
      showNotification(`Error fetching unfulfilled lines: ${err.message}`, 'error');
      setUnfulfilledItems([]);
      return [];
    } finally {
      setUnfulfilledLoading(false);
    }
  }, [recordType, showNotification, mode, originalRecordLineItems]);

  // Fetch unfulfilled items when SOID changes for ItemFulfillment
  useEffect(() => {
    if (recordType === 'ItemFulfillment' && soid && (mode === 'new' || mode === 'edit')) {
      console.log('[SalesItems] SOID changed, fetching unfulfilled items:', soid);
      fetchUnfulfilledSalesOrderLines(soid);
    }
  }, [soid, recordType, mode, fetchUnfulfilledSalesOrderLines]);

  // Fetch uninvoiced items when DNID changes for Invoice
  useEffect(() => {
    if (recordType === 'Invoice' && (mode === 'new' || mode === 'edit')) {
      const dnidList = normalizeIdList(dnid);
      const dnidSignature = getIdSignature(dnidList);

      if (!dnidSignature) {
        if (mode === 'new') {
          itemsLoadedFromSessionStorage.current = false;
        }
        setUninvoicedItems([]);
        return;
      }

      console.log('[SalesItems] DNID changed, fetching uninvoiced items. Mode:', mode, 'IDs:', dnidList);

      // Check if this is a bill button scenario
      const sessionStorageData = sessionStorage.getItem('itemFulfillmentDataForBilling');
      if (mode === 'new') {
        if (sessionStorageData) {
          try {
            const parsedData = JSON.parse(sessionStorageData);
            const storedFulfillmentId = parsedData?.dnid || parsedData?.itemFulfillmentId || parsedData?.IFID || parsedData?.itemFulfillment;
            const storedList = normalizeIdList(storedFulfillmentId);
            const matchesSession = getIdSignature(storedList) === dnidSignature;
            itemsLoadedFromSessionStorage.current = !!matchesSession;
            if (matchesSession) {
              console.log('[SalesItems] ✅ Detected Bill button scenario - will fetch data for RemQty but not populate dropdown');
            }
          } catch (e) {
            console.error('[SalesItems] Error parsing sessionStorage:', e);
            itemsLoadedFromSessionStorage.current = false;
          }
        } else {
          itemsLoadedFromSessionStorage.current = false;
        }
      }

      // ALWAYS fetch - we need rawItemFulfillmentLines for RemQty calculations
      // The itemsLoadedFromSessionStorage flag will prevent quantity recalculation in onUpdateField
      fetchUninvoicedItemFulfillmentLines(dnidList);
    } else if (mode === 'new') {
      itemsLoadedFromSessionStorage.current = false;
    }
  }, [dnid, recordType, mode, fetchUninvoicedItemFulfillmentLines, normalizeIdList, getIdSignature]);



  // Remove the useImperativeHandle - not needed for this implementation

  const initializeFormData = (itemConfig) => {
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

        // Fetch dropdown data for required fields (products and taxes)
        // For Credit Memo, fetch only service items
        const productEndpoint = recordType === 'CreditMemo'
          ? '/product/item-type/d89fbe6f-7421-4b41-becf-d94d2bcb6757'
          : '/product';

        const dropdownPromises = [
          fetchDropdownData(productEndpoint).then(data => ({ name: 'itemID', data })),
          fetchDropdownData('/tax').then(data => ({ name: 'taxID', data }))
        ];

        const dropdownResults = await Promise.all(dropdownPromises);
        if (!isMounted) return;

        const dropdownDataMap = dropdownResults.reduce((acc, { name, data }) => {
          acc[name] = data;
          return acc;
        }, {});

        setDropdownData(dropdownDataMap);

        // Initialize form data
        const initialFormData = initializeFormData(itemConfig);

        if (mode !== 'new' && id) {
          // TODO: Load existing transaction items
          // const existingItems = await loadTransactionItems(id);
          // if (existingItems && existingItems.length > 0) {
          //   initialFormData.items = existingItems;
          // }
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
  }, [mode, id, recordType, getItemConfiguration, fetchDropdownData]);



  const calculateAmount = useCallback((quantity, rate, taxPercent = 0) => {
    // Gross: round to 10 decimals
    const lineTotal = Math.round((quantity || 0) * (rate || 0) * 10000000000) / 10000000000;
    const discountAmount = headerDiscount || 0;
    // Subtotal: round to 2 decimals
    const subtotal = Math.round((lineTotal - discountAmount) * 100) / 100;
    // Tax: round to 2 decimals
    const taxAmount = Math.round(subtotal * (taxPercent || 0) / 100 * 100) / 100;
    // Net: round to 2 decimals
    return Math.round((subtotal + taxAmount) * 100) / 100;
  }, [headerDiscount]);

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
        SalesOrder: {
          endpoint: buildUrl(apiConfig.endpoints.salesOrderLine),
          idField: 'soid',
          quantityField: 'quantity'
        },
        ItemFulfillment: {
          endpoint: buildUrl(apiConfig.endpoints.itemFulfillmentLine),
          idField: 'dnid',
          quantityField: 'quantity'
        },
        Invoice: {
          endpoint: buildUrl(apiConfig.endpoints.invoiceLine),
          idField: 'invoiceId',
          quantityField: 'quantityDelivered'
        }
      };

      const config = transactionConfig[recordType];
      if (!config) {
        throw new Error(`Unsupported record type: ${recordType}`);
      }

      // Create line items one by one (following FormCreator.js pattern)
      const lineCreationPromises = lineItems.map(async (line, index) => {
        const quantity = Number(line.quantity || line.quantityDelivered || 0);
        const rate = Number(line.rate || 0);
        const taxPercent = Number(line.taxPercent || 0);

        // Calculate amounts using header discount
        // Gross: round to 10 decimals
        const lineTotal = Math.round(quantity * rate * 10000000000) / 10000000000;
        const discountAmount = headerDiscount || 0;
        // Subtotal: round to 2 decimals
        const subtotal = Math.round((lineTotal - discountAmount) * 100) / 100;
        // Tax: round to 2 decimals
        const taxAmount = Math.round(lineTotal * taxPercent / 100 * 100) / 100;
        // Net: round to 2 decimals
        const totalAmount = Math.round(lineTotal * (1 + (taxPercent / 100)) * 100) / 100;

        // Build line payload based on transaction type
        const linePayload = {
          [config.idField]: transactionId,
          itemID: line.itemID?.value || line.itemID,
          [config.quantityField]: quantity,
          rate: rate,
          taxID: line.taxID?.value || line.taxID,
          taxPercent: taxPercent,
          taxAmount: taxAmount,
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

    const transformedOptions = options.map(item => {
      if (typeof item === 'string') return { text: item, value: item };
      if (!item.id) return { text: String(item), value: item };

      const getDisplayText = (obj) => {
        // Handle special cases with formatted text for products
        if (fieldName === 'itemID' && obj.itemName && obj.itemCode) {
          return `${obj.itemCode} - ${obj.itemName}`;
        }

        // For tax, use taxName
        if (fieldName === 'taxID' && obj.taxName) {
          return obj.taxName;
        }

        // Priority fields for display
        const displayFields = ['name', 'itemName', 'productName', 'description', 'title', 'taxName'];
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



  // Grid cell components for items - matching exact structure from existing forms
  const ItemCell = (props) => {
    const { parentField, editIndex, validatedItems, onUpdateField, soid, selectedLocation, unfulfilledItems, unfulfilledLoading, dnid, uninvoicedItems, uninvoicedLoading } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;
    const shouldValidate = validatedItems.includes(props.dataItem[ITEM_DATA_INDEX]);
    const [productDetails, setProductDetails] = React.useState(null);
    const [loadingProduct, setLoadingProduct] = React.useState(false);

    const fieldValue = props.dataItem[props.field];
    const productOptions = getDropdownProps('itemID');
    const product = productOptions.find(p => p.value === fieldValue);

    // Fetch product details if not found in dropdown (for inactive/deleted products)
    React.useEffect(() => {
      const fetchProductDetails = async () => {
        if (!isInEdit && !product && fieldValue && !loadingProduct && !productDetails && mode === 'view') {
          setLoadingProduct(true);
          try {
            const response = await fetch(buildUrl(`/product/${fieldValue}`), {
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });

            if (response.ok) {
              const data = await response.json();
              setProductDetails(data);
            } else {
              // Product not found in API either
              setProductDetails({ itemCode: null, itemName: `Product ${fieldValue}` });
            }
          } catch (error) {
            console.error('Error fetching product details:', error);
            setProductDetails({ itemCode: null, itemName: `Product ${fieldValue}` });
          } finally {
            setLoadingProduct(false);
          }
        }
      };

      fetchProductDetails();
    }, [fieldValue, product, loadingProduct, productDetails, isInEdit]);

    if (isInEdit) {
      let productOptions;
      let selectedValue = null;

      if (recordType === 'ItemFulfillment' && (mode === 'new' || mode === 'edit') && soid && unfulfilledItems && unfulfilledItems.length > 0) {
        const allProducts = getDropdownProps('itemID');
        // Filter out items where remaining quantity is 0
        const itemsWithRemainingQty = unfulfilledItems.filter(item => {
          const remQty = (item.quantity || 0) - (item.fulFillQty || 0);
          return remQty > 0;
        });
        productOptions = itemsWithRemainingQty.map(item => {
          const product = allProducts.find(p => p.value === item.itemID);
          // Use line ID as value to support duplicate items
          return {
            text: product ? product.text : `Item ${item.itemID}`,
            value: item.id, // Use sales order line ID as value for duplicate item support
            itemID: item.itemID, // Store the actual itemID for later use
            unfulfilledItem: item // Store unfulfilled item data for later use
          };
        });

        // Find selected value by matching either:
        // 1. The line ID (stored in salesOrderLineId) - for items just selected
        // 2. The actual itemID - for items that have been saved
        const currentItemID = props.dataItem[props.field];
        const currentSalesOrderLineId = props.dataItem.salesOrderLineId;

        selectedValue = productOptions.find(p => {
          // Match by line ID first (most accurate for duplicate items)
          if (currentSalesOrderLineId && p.value === currentSalesOrderLineId) {
            return true;
          }
          // Fallback: match by actual itemID
          if (currentItemID && p.itemID === currentItemID) {
            return true;
          }
          return false;
        }) || null;

      } else if (recordType === 'ItemFulfillment' && mode === 'new' && soid && unfulfilledLoading) {
        productOptions = [{ text: 'Loading unfulfilled items...', value: null }];
        selectedValue = null;
      } else if (recordType === 'Invoice' && (mode === 'new' || mode === 'edit') && dnid && uninvoicedItems && uninvoicedItems.length > 0) {
        const allProducts = getDropdownProps('itemID');
        // Filter out items where remaining quantity to invoice is 0
        const itemsWithRemainingQty = uninvoicedItems.filter(item => {
          const remQty = (item.quantity || 0) - (item.invoiceQty || 0);
          return remQty > 0;
        });
        productOptions = itemsWithRemainingQty.map(item => {
          const product = allProducts.find(p => p.value === item.itemID);
          // Use line ID as value to support duplicate items
          return {
            text: product ? product.text : `Item ${item.itemID}`,
            value: item.id, // Use item fulfillment line ID as value for duplicate item support
            itemID: item.itemID, // Store the actual itemID for later use
            uninvoicedItem: item // Store uninvoiced item data for later use
          };
        });

        // Find selected value by matching either:
        // 1. The line ID (stored in itemFulfillmentLineId) - for items just selected
        // 2. The actual itemID - for items that have been saved
        const currentItemID = props.dataItem[props.field];
        const currentItemFulfillmentLineId = props.dataItem.itemFulfillmentLineId;

        selectedValue = productOptions.find(p => {
          // Match by line ID first (most accurate for duplicate items)
          if (currentItemFulfillmentLineId && p.value === currentItemFulfillmentLineId) {
            return true;
          }
          // Fallback: match by actual itemID
          if (currentItemID && p.itemID === currentItemID) {
            return true;
          }
          return false;
        }) || null;

      } else if (recordType === 'Invoice' && mode === 'new' && dnid && uninvoicedLoading) {
        productOptions = [{ text: 'Loading uninvoiced items...', value: null }];
        selectedValue = null;
      } else {
        productOptions = getDropdownProps('itemID');
        selectedValue = productOptions.find(p => p.value === props.dataItem[props.field]) || null;
      }

      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <DropDownList
            data={productOptions}
            textField="text"
            dataItemKey="value"
            valueField="value"
            value={selectedValue}
            onChange={async (e) => {
              const selectedOption = e.target.value;
              const selectedValue = selectedOption?.value || selectedOption;

              // For ItemFulfillment and Invoice, pass the entire selected option with line data
              const selectedLineData = selectedOption?.unfulfilledItem || selectedOption?.uninvoicedItem;

              await onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, selectedValue, selectedLineData);
            }}
            style={{ width: '100%' }}
          />
        </td>
      );
    }

    // In view mode, if product is not found in dropdown, try to get it from dropdownData directly
    let productName = product?.text || '';

    if (!productName && fieldValue && dropdownData.itemID) {
      const productItem = dropdownData.itemID.find(p => p.id === fieldValue);
      if (productItem) {
        productName = productItem.itemCode && productItem.itemName
          ? `${productItem.itemCode} - ${productItem.itemName}`
          : productItem.itemName || productItem.itemCode || '';
      }
    }

    // Use fetched product details if available
    if (!productName && productDetails) {
      productName = productDetails.itemCode && productDetails.itemName
        ? `${productDetails.itemCode} - ${productDetails.itemName}`
        : productDetails.itemName || productDetails.itemCode || '';
    }

    // Show loading state
    if (!productName && loadingProduct) {
      productName = 'Loading...';
    }

    // Fallback: show itemID if name still not found
    if (!productName && fieldValue) {
      productName = `Product ${fieldValue}`;
    }

    return (
      <td {...props.tdProps}>
        <span style={{ padding: '8px', display: 'block' }}>
          {productName}
        </span>
      </td>
    );
  };

  const QuantityCell = (props) => {
    const { parentField, editIndex, validatedItems, onUpdateField, soid, selectedLocation, unfulfilledItems, unfulfilledLoading, dnid, uninvoicedItems, uninvoicedLoading, rawSalesOrderLines, rawItemFulfillmentLines } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;
    const originalQuantityRef = React.useRef(null);

    // Store original quantity when editing starts
    React.useEffect(() => {
      if (isInEdit && originalQuantityRef.current === null) {
        originalQuantityRef.current = props.dataItem[props.field] || 0;
      } else if (!isInEdit) {
        originalQuantityRef.current = null;
      }
    }, [isInEdit, props.dataItem, props.field]);

    if (isInEdit) {
      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <Input
            type="number"
            min="0"
            step="1"
            value={props.dataItem[props.field] ?? ''}
            onChange={async (e) => {
              const originalQuantity = originalQuantityRef.current || 0;
              const inputValue = e.target.value;
              let newValue = inputValue === '' ? '' : parseInt(inputValue) || '';


              // Validation for ItemFulfillment edit mode only with proper calculations
              if (recordType === 'ItemFulfillment' && (mode === 'edit' || mode === 'new') && newValue !== '' && props.dataItem.itemID && soid) {
                try {
                  // Find the sales order line by salesOrderLineId (NOT by itemID - multiple lines can have same itemID)
                  const salesOrderLineId = props.dataItem.salesOrderLineId || props.dataItem.soLineId;

                  // In EDIT mode: Use RAW sales order line data to get the real remaining qty
                  const rawSalesOrderLine = salesOrderLineId && rawSalesOrderLines && rawSalesOrderLines.length > 0
                    ? rawSalesOrderLines.find(line => line.id === salesOrderLineId)
                    : null;

                  // Fallback to unfulfilledItems if raw data not available (for new mode)
                  const salesOrderLine = rawSalesOrderLine || (salesOrderLineId
                    ? unfulfilledItems.find(line => line.id === salesOrderLineId)
                    : unfulfilledItems.find(line => line.itemID === props.dataItem.itemID)); // Fallback for old records

                  if (salesOrderLine) {
                    const changedQuantity = parseInt(newValue) || 0; // New quantity user is trying to set

                    // Get the ORIGINAL sales order quantity (from raw data if available)
                    const originalSOQuantity = rawSalesOrderLine ? (rawSalesOrderLine.quantity || 0) : (salesOrderLine.quantity || 0);

                    // Get the CURRENT fulfilled quantity (from raw data if in edit mode)
                    const currentFulfillQty = rawSalesOrderLine ? (rawSalesOrderLine.fulFillQty || 0) : (salesOrderLine.fulFillQty || 0);

                    // In EDIT mode: current item's original quantity should be excluded from fulfilled qty
                    // to calculate what's available for THIS record
                    let availableQuantity;
                    if (mode === 'edit' && originalQuantity > 0) {
                      // Available = Original SO Qty - (Fulfilled by others)
                      // Fulfilled by others = Total Fulfilled - Current record's original qty
                      const fulfilledByOthers = Math.max(0, currentFulfillQty - originalQuantity);
                      availableQuantity = originalSOQuantity - fulfilledByOthers;
                      console.log(`[Quantity Validation EDIT] salesOrderLineId: ${salesOrderLineId}, originalSOQty: ${originalSOQuantity}, totalFulfilled: ${currentFulfillQty}, currentRecordOriginalQty: ${originalQuantity}, fulfilledByOthers: ${fulfilledByOthers}, availableForThisRecord: ${availableQuantity}, changedQuantity: ${changedQuantity}`);
                    } else {
                      // NEW mode: Simple formula: Sales Order Quantity - Current Fulfilled Quantity = Available
                      availableQuantity = originalSOQuantity - currentFulfillQty;
                      console.log(`[Quantity Validation NEW] salesOrderLineId: ${salesOrderLineId}, originalSOQty: ${originalSOQuantity}, currentFulfillQty: ${currentFulfillQty}, availableQuantity: ${availableQuantity}, changedQuantity: ${changedQuantity}`);
                    }

                    // Check if new quantity exceeds available quantity
                    if (changedQuantity > availableQuantity) {
                      alert(`Quantity ${changedQuantity} exceeds remaining quantity ${availableQuantity} from sales order line.`);
                      newValue = Math.max(0, availableQuantity); // Set to maximum available quantity
                    }
                  }
                } catch (error) {
                  console.error('Error validating quantity in edit mode:', error);
                }
              }

              // Validation for Invoice edit mode only with proper calculations
              if (recordType === 'Invoice' && (mode === 'edit' || mode === 'new') && newValue !== '' && props.dataItem.itemID && dnid) {
                try {
                  // Find the item fulfillment line by itemFulfillmentLineId (NOT by itemID - multiple lines can have same itemID)
                  const itemFulfillmentLineId = props.dataItem.itemFulfillmentLineId || props.dataItem.ifLineId;

                  // In EDIT mode: Use RAW item fulfillment line data to get the real remaining qty
                  const rawItemFulfillmentLine = itemFulfillmentLineId && rawItemFulfillmentLines && rawItemFulfillmentLines.length > 0
                    ? rawItemFulfillmentLines.find(line => line.id === itemFulfillmentLineId)
                    : null;

                  // Fallback to uninvoicedItems if raw data not available (for new mode)
                  const itemFulfillmentLine = rawItemFulfillmentLine || (itemFulfillmentLineId
                    ? uninvoicedItems.find(line => line.id === itemFulfillmentLineId)
                    : uninvoicedItems.find(line => line.itemID === props.dataItem.itemID)); // Fallback for old records

                  if (itemFulfillmentLine) {
                    const changedQuantity = parseInt(newValue) || 0; // New quantity user is trying to set

                    // Get the ORIGINAL item fulfillment quantity (from raw data if available)
                    const originalIFQuantity = rawItemFulfillmentLine ? (rawItemFulfillmentLine.quantity || 0) : (itemFulfillmentLine.quantity || 0);

                    // Get the CURRENT invoiced quantity (from raw data if in edit mode)
                    const currentInvoicedQty = rawItemFulfillmentLine ? (rawItemFulfillmentLine.invoicedQty || 0) : (itemFulfillmentLine.invoicedQty || 0);

                    // In EDIT mode: current item's original quantity should be excluded from invoiced qty
                    // to calculate what's available for THIS record
                    let availableQuantity;
                    if (mode === 'edit' && originalQuantity > 0) {
                      // Available = Original IF Qty - (Invoiced by others)
                      // Invoiced by others = Total Invoiced - Current record's original qty
                      const invoicedByOthers = Math.max(0, currentInvoicedQty - originalQuantity);
                      availableQuantity = originalIFQuantity - invoicedByOthers;
                      console.log(`[Quantity Validation EDIT Invoice] itemFulfillmentLineId: ${itemFulfillmentLineId}, originalIFQty: ${originalIFQuantity}, totalInvoiced: ${currentInvoicedQty}, currentRecordOriginalQty: ${originalQuantity}, invoicedByOthers: ${invoicedByOthers}, availableForThisRecord: ${availableQuantity}, changedQuantity: ${changedQuantity}`);
                    } else {
                      // NEW mode: Simple formula: Fulfillment Quantity - Current Invoiced Quantity = Available
                      availableQuantity = originalIFQuantity - currentInvoicedQty;
                      console.log(`[Quantity Validation NEW Invoice] itemFulfillmentLineId: ${itemFulfillmentLineId}, originalIFQty: ${originalIFQuantity}, currentInvoicedQty: ${currentInvoicedQty}, availableQuantity: ${availableQuantity}, changedQuantity: ${changedQuantity}`);
                    }

                    // Check if new quantity exceeds available quantity
                    if (changedQuantity > availableQuantity) {
                      alert(`Quantity ${changedQuantity} exceeds remaining quantity ${availableQuantity} from item fulfillment.`);
                      newValue = Math.max(0, availableQuantity); // Set to maximum available quantity
                    }
                  }
                } catch (error) {
                  console.error('Error validating quantity in edit mode:', error);
                }
              }

              // Removed quantity validation logic - restriction was never activated
              onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, newValue);
            }}
            onKeyDown={(e) => {
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

  const RateCell = (props) => {
    const { parentField, editIndex, onUpdateField } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;

    if (isInEdit) {
      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <Input
            type="number"
            min="0"
            step="0.0000000001"
            value={props.dataItem[props.field] ?? ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              // Allow up to 10 decimal places
              if (inputValue !== '') {
                const parsed = parseFloat(inputValue);
                if (!isNaN(parsed)) {
                  // Round to 10 decimal places to prevent floating point issues
                  const newValue = Math.round(parsed * 10000000000) / 10000000000;
                  onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, newValue);
                  return;
                }
              }
              onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, inputValue === '' ? '' : 0);
            }}
            style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '13px' }}
          />
        </td>
      );
    }

    const value = props.dataItem[props.field];
    // Display up to 10 decimal places but remove trailing zeros
    const formattedValue = value !== null && value !== undefined && typeof value === 'number' ?
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 10,
        useGrouping: true
      }).format(value) :
      (value === 0 ? '0.00' : '');

    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        <span style={{ padding: '8px', display: 'block' }}>
          {formattedValue}
        </span>
      </td>
    );
  };




  const TaxCell = (props) => {
    const { parentField, editIndex, validatedItems, onUpdateField } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;

    if (isInEdit) {
      const taxOptions = getDropdownProps('taxID');

      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <DropDownList
            data={taxOptions}
            textField="text"
            dataItemKey="value"
            valueField="value"
            value={taxOptions.find(t => t.value === props.dataItem.taxID) || null}
            onChange={(e) => {
              const selectedValue = e.target.value?.value || e.target.value;
              onUpdateField(props.dataItem[ITEM_DATA_INDEX], 'taxID', selectedValue);
            }}
            style={{ width: '100%' }}
            disabled={true}
          />
        </td>
      );
    }

    const fieldValue = props.dataItem.taxID;
    const taxOptions = getDropdownProps('taxID');

    // Handle both object values (old) and value values (new)
    let taxValue;
    if (typeof fieldValue === 'object' && fieldValue?.value) {
      taxValue = fieldValue.value;
    } else {
      taxValue = fieldValue;
    }

    const tax = taxOptions.find(t => t.value === taxValue);
    const taxText = tax?.text || '';

    return (
      <td {...props.tdProps}>
        <span style={{ padding: '8px', display: 'block' }}>
          {taxText}
        </span>
      </td>
    );
  };

  const TaxPercentCell = (props) => {
    const taxPercent = props.dataItem.taxPercent || 0;

    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        <span style={{ padding: '8px', display: 'block' }}>
          {taxPercent.toFixed(1)}%
        </span>
      </td>
    );
  };

  const TaxAmountCell = (props) => {
    // For Invoice, use taxRate field; for others, use taxAmount
    const fieldName = recordType === 'Invoice' ? 'taxRate' : 'taxAmount';
    const taxValue = props.dataItem[fieldName] || 0;

    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        <span style={{ padding: '8px', display: 'block' }}>
          {taxValue.toFixed(2)}
        </span>
      </td>
    );
  };

  const TotalAmountCell = (props) => {
    const totalAmount = props.dataItem.totalAmount || 0;

    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        <span style={{ padding: '8px', display: 'block', fontWeight: 'bold' }}>
          {totalAmount.toFixed(2)}
        </span>
      </td>
    );
  };

  // Fulfilled Qty Cell - only for SalesOrder in edit/view mode, always disabled
  const FulfilledQtyCell = (props) => {
    const fulfilledQty = props.dataItem.fulFillQty || 0;

    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        <span style={{ padding: '8px', display: 'block', color: '#666', fontStyle: 'italic' }}>
          {fulfilledQty}
        </span>
      </td>
    );
  };

  // Invoiced Qty Cell - only for ItemFulfillment in edit/view mode, always disabled
  const InvoicedQtyCell = (props) => {
    const invoicedQty = props.dataItem.invoicedQty || 0;

    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        <span style={{ padding: '8px', display: 'block', color: '#666', fontStyle: 'italic' }}>
          {invoicedQty}
        </span>
      </td>
    );
  };

  // Remaining Qty Cell - only for ItemFulfillment and Invoice in edit/create mode, always disabled
  const RemQtyCell = (props) => {
    const { unfulfilledItems, uninvoicedItems, rawSalesOrderLines, rawItemFulfillmentLines } = React.useContext(ItemGridEditContext);

    // Calculate remaining quantity based on record type
    let remainingQty = 0;

    if (recordType === 'ItemFulfillment' && props.dataItem.itemID) {
      // Match by salesOrderLineId (parent line ID) to handle duplicate items correctly
      const salesOrderLineId = props.dataItem.salesOrderLineId || props.dataItem.soLineId;

      if (salesOrderLineId && rawSalesOrderLines && rawSalesOrderLines.length > 0) {
        // FETCH REAL REMAINING QTY FROM RAW SALES ORDER LINE DATA (not from modified unfulfilledItems)
        // This shows the actual remaining quantity from the database SalesOrderLine table
        const rawSalesOrderLine = rawSalesOrderLines.find(line => line.id === salesOrderLineId);
        if (rawSalesOrderLine) {
          // Real remaining qty = SO quantity - fulFillQty (from database)
          // IMPORTANT: Ensure remainingQty is never negative (Math.max ensures floor of 0)
          remainingQty = Math.max(0, (rawSalesOrderLine.quantity || 0) - (rawSalesOrderLine.fulFillQty || 0));
        }
      } else if (salesOrderLineId && unfulfilledItems && unfulfilledItems.length > 0) {
        // Fallback to unfulfilledItems if raw data not available
        const salesOrderLine = unfulfilledItems.find(line => line.id === salesOrderLineId);
        if (salesOrderLine) {
          remainingQty = Math.max(0, (salesOrderLine.quantity || 0) - (salesOrderLine.fulFillQty || 0));
        }
      } else {
        // In edit mode without parent line ID: show already-set quantity as remaining
        // This prevents showing incorrect remaining qty for duplicate items in edit mode
        remainingQty = Math.max(0, props.dataItem.quantity || props.dataItem.quantityDelivered || 0);
      }
    }

    if (recordType === 'Invoice' && props.dataItem.itemID) {
      // Match by itemFulfillmentLineId (parent line ID) to handle duplicate items correctly
      const itemFulfillmentLineId = props.dataItem.itemFulfillmentLineId || props.dataItem.ifLineId;
      const currentInvoiceLineQty = parseFloat(props.dataItem.quantityDelivered || props.dataItem.quantity || 0);

      if (itemFulfillmentLineId && rawItemFulfillmentLines && rawItemFulfillmentLines.length > 0) {
        // FETCH REAL REMAINING QTY FROM RAW ITEM FULFILLMENT LINE DATA (not from modified uninvoicedItems)
        // This shows the actual remaining quantity from the database ItemFulfillmentLine table
        // EXACTLY THE SAME LOGIC AS ITEMFULFILLMENT: Just IF.quantity - IF.invoicedQty
    
        const rawItemFulfillmentLine = rawItemFulfillmentLines.find(line => line.id === itemFulfillmentLineId);
        if (rawItemFulfillmentLine) {
          // Real remaining qty = IF quantity - invoicedQty (from database)
          // IMPORTANT: Ensure remainingQty is never negative (Math.max ensures floor of 0)
          // SAME AS ITEMFULFILLMENT: No adding back, just show what's in the database
          remainingQty = Math.max(0, (rawItemFulfillmentLine.quantity || 0) - (rawItemFulfillmentLine.invoicedQty || 0));
        } else {
          console.log(`[RemQtyCell INVOICE] ❌ NOT FOUND in rawItemFulfillmentLines (itemFulfillmentLineId: ${itemFulfillmentLineId})`);
        }
      } else if (!itemFulfillmentLineId && rawItemFulfillmentLines && rawItemFulfillmentLines.length > 0 && mode === 'edit') {
        // LEGACY DATA FALLBACK: No itemFulfillmentLineId - try to match by itemID + quantity
        // This handles old invoice records created before itemFulfillmentLineId tracking was added
        console.log(`[RemQtyCell INVOICE] ⚠️ LEGACY DATA: No itemFulfillmentLineId. Attempting to match by itemID + quantity`);

        const currentQty = parseFloat(props.dataItem.quantityDelivered || props.dataItem.quantity || 0);
        const matchingIFLine = rawItemFulfillmentLines.find(line =>
          line.itemID === props.dataItem.itemID &&
          parseFloat(line.quantity || 0) === currentQty
        );

        if (matchingIFLine) {
          const ifQty = parseFloat(matchingIFLine.quantity || 0);
          const ifInvoicedQty = parseFloat(matchingIFLine.invoicedQty || 0);
          remainingQty = Math.max(0, ifQty - ifInvoicedQty);
          console.log(`[RemQtyCell INVOICE] ✅ LEGACY MATCH by itemID+qty: IF Line ${matchingIFLine.id}:`, {
            itemID: matchingIFLine.itemID,
            quantity: ifQty,
            invoicedQty: ifInvoicedQty,
            calculated_remaining: remainingQty
          });
        } else {
          // Can't match - just show current quantity
          remainingQty = Math.max(0, currentQty);
          console.log(`[RemQtyCell INVOICE] ❌ LEGACY: Could not match by itemID+qty. Using current qty:`, remainingQty);
        }
      } else if (itemFulfillmentLineId && uninvoicedItems && uninvoicedItems.length > 0) {
        // Fallback to uninvoicedItems if raw data not available
        console.log(`[RemQtyCell INVOICE] Using uninvoicedItems fallback. Looking for IF line ${itemFulfillmentLineId} in uninvoicedItems:`, uninvoicedItems.map(l => ({ id: l.id, itemID: l.itemID, qty: l.quantity, invoicedQty: l.invoicedQty })));

        const itemFulfillmentLine = uninvoicedItems.find(line => line.id === itemFulfillmentLineId);
        if (itemFulfillmentLine) {
          remainingQty = Math.max(0, (itemFulfillmentLine.quantity || 0) - (itemFulfillmentLine.invoicedQty || 0));
          console.log(`[RemQtyCell INVOICE] ✅ FOUND in uninvoicedItems:`, {
            quantity: itemFulfillmentLine.quantity,
            invoicedQty: itemFulfillmentLine.invoicedQty,
            calculated_remaining: remainingQty
          });
        } else {
          console.log(`[RemQtyCell INVOICE] ❌ NOT FOUND in uninvoicedItems`);
        }
      } else {
        // In edit mode without parent line ID: show already-set quantity as remaining
        // This prevents showing incorrect remaining qty for duplicate items in edit mode
        remainingQty = Math.max(0, props.dataItem.quantity || props.dataItem.quantityInvoiced || props.dataItem.quantityDelivered || 0);
        console.log(`[RemQtyCell INVOICE] ⚠️ FALLBACK: No itemFulfillmentLineId or no raw data. Using dataItem quantity:`, remainingQty);
      }
    }
    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        <span style={{ padding: '8px', display: 'block', color: '#666', fontStyle: 'italic' }}>
          {remainingQty}
        </span>
      </td>
    );
  };

  const CommandCell = (props) => {
    const { onRemove, onEdit, onSave, onCancel, editIndex, validateItem } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;
    // Item is new if it has tempId (not yet saved to DB) or no itemID selected
    const isNewItem = props.dataItem.tempId || !props.dataItem.itemID;

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
      onCancel(props.dataItem);
    }, [props.dataItem, onCancel]);

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
  const SalesItemsGrid = (fieldArrayRenderProps) => {
    const { validationMessage, visited, name, dataItemKey, onTotalAmountChange } = fieldArrayRenderProps;
    const [editIndex, setEditIndex] = useState(undefined);
    const editItemCloneRef = React.useRef(undefined);
    const [validatedItems, setValidatedItems] = useState([]);

    // Track editIndex changes for CreditMemo
    React.useEffect(() => {
      if (recordType === 'CreditMemo') {
        console.log('[CreditMemo editIndex] CHANGED', {
          editIndex,
          timestamp: new Date().toISOString(),
          stackTrace: new Error().stack
        });
      }
    }, [editIndex]);

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

    const onUpdateField = useCallback(async (index, fieldName, value, selectedLineData = null) => {

      if (!fieldArrayRenderProps.value || !fieldArrayRenderProps.value[index]) {
        return;
      }

      const currentItem = fieldArrayRenderProps.value[index];

      if (recordType === 'CreditMemo') {
        console.log('[CreditMemo onUpdateField] START', {
          index,
          fieldName,
          value,
          currentEditIndex: editIndex,
          currentItem: { ...currentItem },
          timestamp: new Date().toISOString()
        });
      }

      const updatedItem = {
        ...currentItem,
        [fieldName]: value
      };

      // Removed quantity limit validation - restriction was never activated

      // When item is selected, automatically fetch sales price and tax code
      if (fieldName === 'itemID' && value) {
        try {

          if (!selectedLocation) {
            alert('Please select a location first');
            // Clear the item selection
            updatedItem.itemID = '';
            fieldArrayRenderProps.onReplace({
              index: index,
              value: updatedItem
            });
            return;
          }

          // Duplicate items are now allowed - each line tracked with unique tempId/id

          const currentItems = fieldArrayRenderProps.value || [];

          // For ItemFulfillment: Use the passed selectedLineData which contains the exact SO line
          if (recordType === 'ItemFulfillment' && (mode === 'new' || mode === 'edit') && soid && selectedLineData) {
            try {
              console.log('[SalesItems] Using selected line data:', selectedLineData);

              // CHECK FOR DUPLICATE salesOrderLineId (same line from sales order cannot be added twice)
              const salesOrderLineId = selectedLineData.id || selectedLineData.salesOrderLineId;
              const existingLineWithSameSalesOrderLineId = currentItems.find((item, idx) =>
                idx !== index && item.salesOrderLineId === salesOrderLineId
              );

              if (existingLineWithSameSalesOrderLineId) {
                alert(`This sales order line is already added to the item fulfillment. You cannot add the same sales order line twice.`);
                // Clear the item selection
                updatedItem.itemID = '';
                updatedItem.salesOrderLineId = '';
                fieldArrayRenderProps.onReplace({
                  index: index,
                  value: updatedItem
                });
                return;
              }

              // Set itemID to the actual product ID (not the line ID)
              updatedItem.itemID = selectedLineData.itemID;
              // Use data from selected SO line
              updatedItem.rate = selectedLineData.rate || 0;
              updatedItem.taxID = selectedLineData.taxID || '';
              updatedItem.taxPercent = selectedLineData.taxPercent || 0;
              updatedItem.taxAmount = selectedLineData.taxAmount || 0;
              // Set quantity to remaining unfulfilled quantity
              updatedItem.quantity = (selectedLineData.quantity || 0) - (selectedLineData.fulFillQty || 0);
              // IMPORTANT: Store the parent sales order line ID for duplicate item support
              updatedItem.salesOrderLineId = selectedLineData.id || selectedLineData.salesOrderLineId;
              console.log('[SalesItems] Set salesOrderLineId:', updatedItem.salesOrderLineId);
            } catch (error) {
              console.error('[SalesItems] Error processing selected line data:', error);
            }
          }
          // For ItemFulfillment: Use unfulfilled items data (already merged with record data in fetch function)
          else if (recordType === 'ItemFulfillment' && (mode === 'new' || mode === 'edit') && soid && unfulfilledItems && unfulfilledItems.length > 0) {
            try {
              let changedItem = unfulfilledItems.find(item => item.id === value);
              console.log('[SalesItems] Looking for item by line ID', value, 'in unfulfilled items. Found:', !!changedItem);

              if (changedItem) {
                // CHECK FOR DUPLICATE salesOrderLineId (same line from sales order cannot be added twice)
                const salesOrderLineId = changedItem.id || changedItem.salesOrderLineId;
                const existingLineWithSameSalesOrderLineId = currentItems.find((item, idx) =>
                  idx !== index && item.salesOrderLineId === salesOrderLineId
                );

                if (existingLineWithSameSalesOrderLineId) {
                  alert(`This sales order line is already added to the item fulfillment. You cannot add the same sales order line twice.`);
                  // Clear the item selection
                  updatedItem.itemID = '';
                  updatedItem.salesOrderLineId = '';
                  fieldArrayRenderProps.onReplace({
                    index: index,
                    value: updatedItem
                  });
                  return;
                }

                // The data is already merged (record data replaces API data where salesOrderLineId matches)
                updatedItem.itemID = changedItem.itemID;
                updatedItem.rate = changedItem.rate || 0;
                updatedItem.taxID = changedItem.taxID || '';
                updatedItem.taxPercent = changedItem.taxPercent || 0;
                updatedItem.taxAmount = changedItem.taxAmount || 0;
                updatedItem.quantity = (changedItem.quantity || 0) - (changedItem.fulFillQty || 0);
                updatedItem.salesOrderLineId = changedItem.id || changedItem.salesOrderLineId;
                console.log('[SalesItems] Using unfulfilled item data (already merged):', changedItem);
              }
            } catch (error) {
              console.error('[SalesItems] Error processing unfulfilled item data:', error);
            }
          }

          // For Invoice: Use the passed selectedLineData which contains the exact IF line
          else if (recordType === 'Invoice' && (mode === 'new' || mode === 'edit') && dnid && selectedLineData) {
            try {
              console.log('[SalesItems] Using selected line data:', selectedLineData);

              // Detect if this is the INITIAL selection of an item (itemID field is being set for the first time)
              // vs. a re-trigger of the dropdown onChange after the item was already selected
              const isInitialSelection = !currentItem.itemID || currentItem.itemID === '';
              const currentItemFulfillmentLineId = currentItem.itemFulfillmentLineId || currentItem.ifLineId;
              const isReSelectionOfSameItem = currentItemFulfillmentLineId && currentItemFulfillmentLineId === (selectedLineData.id || selectedLineData.itemFulfillmentLineId);

              // Generate a unique key for this item to track if it's been initialized
              const itemKey = `${currentItem.id || currentItem.tempId || index}_${selectedLineData.id}`;
              const alreadyInitialized = initializedItemsRef.current.has(itemKey);

              // SPECIAL CASE: If items were loaded from sessionStorage AND this is the first time we're seeing this item
              // then preserve the quantity. But if the user is actively selecting/changing items, allow the update.
              const isPreLoadedFromSessionStorage = itemsLoadedFromSessionStorage.current
                && currentItem.quantityDelivered > 0
                && !alreadyInitialized
                && currentItemFulfillmentLineId === (selectedLineData.id || selectedLineData.itemFulfillmentLineId);

              // Mark this item as initialized
              if (isPreLoadedFromSessionStorage) {
                initializedItemsRef.current.add(itemKey);
              }

              console.log('[SalesItems] Invoice line status (selectedLineData path):', {
                isInitialSelection,
                isReSelectionOfSameItem,
                isPreLoadedFromSessionStorage,
                alreadyInitialized,
                itemKey,
                currentItemID: currentItem.itemID,
                currentItemFulfillmentLineId,
                selectedLineDataId: selectedLineData.id,
                currentQty: currentItem.quantityDelivered,
                currentItemId: currentItem.id,
                currentTempId: currentItem.tempId
              });

              // CHECK FOR DUPLICATE itemFulfillmentLineId (same line from item fulfillment cannot be added twice)
              const itemFulfillmentLineId = selectedLineData.id || selectedLineData.itemFulfillmentLineId;
              const existingLineWithSameItemFulfillmentLineId = currentItems.find((item, idx) =>
                idx !== index && item.itemFulfillmentLineId === itemFulfillmentLineId
              );

              if (existingLineWithSameItemFulfillmentLineId) {
                alert(`This item fulfillment line is already added to the invoice. You cannot add the same item fulfillment line twice.`);
                // Clear the item selection
                updatedItem.itemID = '';
                updatedItem.itemFulfillmentLineId = '';
                fieldArrayRenderProps.onReplace({
                  index: index,
                  value: updatedItem
                });
                return;
              }

              // Set itemID to the actual product ID (not the line ID)
              updatedItem.itemID = selectedLineData.itemID;
              // Use data from selected IF line
              updatedItem.rate = selectedLineData.rate || 0;
              updatedItem.taxID = selectedLineData.taxID || '';
              updatedItem.taxPercent = selectedLineData.taxPercent || 0;
              updatedItem.taxAmount = selectedLineData.taxAmount || 0;

              // CRITICAL FIX: Only set quantity if this is the INITIAL selection
              // If the user is re-triggering the dropdown (same itemFulfillmentLineId), preserve their edited quantity
              // ALSO: If items were pre-loaded from sessionStorage on first render, preserve the quantity ONCE
              if ((isInitialSelection || !isReSelectionOfSameItem) && !isPreLoadedFromSessionStorage) {
                // Initial selection of item - set to remaining uninvoiced quantity
                updatedItem.quantityDelivered = (selectedLineData.quantity || 0) - (selectedLineData.invoicedQty || 0);
                console.log('[SalesItems] INITIAL selection: Setting quantityDelivered to', updatedItem.quantityDelivered);
              } else if (isPreLoadedFromSessionStorage) {
                // First render with pre-loaded data - preserve the quantity from sessionStorage
                console.log('[SalesItems] PRESERVING quantityDelivered on first render:', currentItem.quantityDelivered, '(Pre-loaded from sessionStorage)');
                // Don't override - it's already in updatedItem from spreading currentItem
              } else {
                // Re-selection of same item - preserve the user's edited quantity
                console.log('[SalesItems] PRESERVING quantityDelivered:', currentItem.quantityDelivered, '(Re-selection)');
                // Don't override - it's already in updatedItem from spreading currentItem
              }

              // IMPORTANT: Store the parent item fulfillment line ID for duplicate item support
              updatedItem.itemFulfillmentLineId = selectedLineData.id || selectedLineData.itemFulfillmentLineId;
              console.log('[SalesItems] Set itemFulfillmentLineId:', updatedItem.itemFulfillmentLineId);
            } catch (error) {
              console.error('[SalesItems] Error processing selected line data:', error);
            }
          }
          // For Invoice: Use uninvoiced items data (already merged with record data in fetch function)
          else if (recordType === 'Invoice' && (mode === 'new' || mode === 'edit') && dnid && uninvoicedItems && uninvoicedItems.length > 0) {
            try {
              const changedItem = uninvoicedItems.find(item => item.id === value);
              console.log('[SalesItems] Looking for item by line ID', value, 'in uninvoiced items. Found:', !!changedItem);
              if (changedItem) {
                // CHECK FOR DUPLICATE itemFulfillmentLineId (same line from item fulfillment cannot be added twice)
                const itemFulfillmentLineId = changedItem.id || changedItem.itemFulfillmentLineId;
                const existingLineWithSameItemFulfillmentLineId = currentItems.find((item, idx) =>
                  idx !== index && item.itemFulfillmentLineId === itemFulfillmentLineId
                );

                if (existingLineWithSameItemFulfillmentLineId) {
                  alert(`This item fulfillment line is already added to the invoice. You cannot add the same item fulfillment line twice.`);
                  // Clear the item selection
                  updatedItem.itemID = '';
                  updatedItem.itemFulfillmentLineId = '';
                  fieldArrayRenderProps.onReplace({
                    index: index,
                    value: updatedItem
                  });
                  return;
                }

                // Detect if this is the INITIAL selection of an item (itemID field is being set for the first time)
                // vs. a re-trigger of the dropdown onChange after the item was already selected
                const isInitialSelection = !currentItem.itemID || currentItem.itemID === '';
                const currentItemFulfillmentLineId = currentItem.itemFulfillmentLineId || currentItem.ifLineId;
                const isReSelectionOfSameItem = currentItemFulfillmentLineId && currentItemFulfillmentLineId === (changedItem.id || changedItem.itemFulfillmentLineId);

                console.log('[SalesItems] Invoice line status (uninvoicedItems path):', {
                  isInitialSelection,
                  isReSelectionOfSameItem,
                  currentItemID: currentItem.itemID,
                  currentItemFulfillmentLineId,
                  changedItemId: changedItem.id,
                  currentQty: currentItem.quantityDelivered,
                  currentItemId: currentItem.id,
                  currentTempId: currentItem.tempId
                });

                // The data is already merged (record data replaces API data where itemFulfillmentLineId matches)
                updatedItem.itemID = changedItem.itemID;
                updatedItem.rate = changedItem.rate || 0;
                updatedItem.taxID = changedItem.taxID || '';
                updatedItem.taxPercent = changedItem.taxPercent || 0;
                updatedItem.taxAmount = changedItem.taxAmount || 0;

                // CRITICAL FIX: Only set quantity if this is the INITIAL selection
                // If the user is re-triggering the dropdown (same itemFulfillmentLineId), preserve their edited quantity
                if (isInitialSelection || !isReSelectionOfSameItem) {
                  // Initial selection of item - set to remaining uninvoiced quantity
                  updatedItem.quantityDelivered = (changedItem.quantity || 0) - (changedItem.invoicedQty || 0);
                  console.log('[SalesItems] INITIAL selection: Setting quantityDelivered to', updatedItem.quantityDelivered);
                } else {
                  // Re-selection of same item - preserve the user's edited quantity
                  console.log('[SalesItems] RE-SELECTION of same item: Preserving quantityDelivered', currentItem.quantityDelivered);
                  // Don't override - it's already in updatedItem from spreading currentItem
                }

                updatedItem.itemFulfillmentLineId = changedItem.id || changedItem.itemFulfillmentLineId;
                console.log('[SalesItems] Using uninvoiced item data (already merged):', changedItem);
              }
            } catch (error) {
              console.error('Error finding uninvoiced item by line ID:', error);
              // Fallback to API
              const { salesPrice, taxCode } = await getProductSalesPriceTaxCode(value);
              updatedItem.rate = salesPrice || 0;
              updatedItem.taxID = taxCode || '';
            }
          } else {
            // Get product details from API for other cases (CreditMemo, SalesOrder)
            try {
              const { salesPrice, taxCode } = await getProductSalesPriceTaxCode(value, selectedLocation);

              // For CreditMemo, ensure we have a valid sales price before proceeding
              if (recordType === 'CreditMemo' && (!salesPrice || salesPrice === 0)) {
                console.warn('[CreditMemo] No sales price found for item:', value);
                // Keep the rate as entered or 0, don't auto-exit edit mode
              }

              // Set the sales price in the rate field
              updatedItem.rate = salesPrice || 0;
              // Set the tax code in the taxID field
              updatedItem.taxID = taxCode || '';
            } catch (error) {
              console.error('[SalesItems] Error fetching product details:', error);
              // Keep defaults on error
              updatedItem.rate = 0;
              updatedItem.taxID = '';
            }
          }

        } catch (error) {
          // Continue with the item selection even if price/tax fetch fails
        }
      }

      if (recordType === 'CreditMemo') {
        console.log('[CreditMemo onUpdateField] BEFORE onReplace', {
          index,
          updatedItem: { ...updatedItem },
          currentEditIndex: editIndex,
          timestamp: new Date().toISOString()
        });
      }

      fieldArrayRenderProps.onReplace({
        index: index,
        value: updatedItem
      });

      if (recordType === 'CreditMemo') {
        console.log('[CreditMemo onUpdateField] AFTER onReplace', {
          index,
          currentEditIndex: editIndex,
          timestamp: new Date().toISOString()
        });
      }
    }, [fieldArrayRenderProps, recordType, showNotification, selectedLocation, getProductSalesPriceTaxCode, editIndex]);

    // Function to calculate totals
    const calculateTotals = React.useCallback((items) => {
      if (!items || items.length === 0) {
        return { totalAmount: 0, totalQuantity: 0 };
      }
      const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      const quantityField = recordType === 'Invoice' ? 'quantityDelivered' : 'quantity';
      const totalQuantity = items.reduce((sum, item) => sum + (item[quantityField] || 0), 0);
      return { totalAmount, totalQuantity };
    }, [recordType]);

    // State-based totals that only update on button actions (Add, Edit, Discard, Delete)
    const [totals, setTotals] = useState(() => calculateTotals(fieldArrayRenderProps.value));
  const autoPopulateStateRef = useRef({ dnid: null, soid: null });


    // Initialize parent component with initial total amount
    useEffect(() => {
      if (onTotalAmountChange) {
        onTotalAmountChange(totals.totalAmount);
      }
    }, [onTotalAmountChange, totals.totalAmount]);

    // Function to update totals - only called on button actions
    const updateTotals = useCallback(() => {
      const newTotals = calculateTotals(fieldArrayRenderProps.value);
      setTotals(newTotals);

      // Pass total amount to parent component if callback provided
      if (onTotalAmountChange) {
        onTotalAmountChange(newTotals.totalAmount);
      }
    }, [fieldArrayRenderProps.value, recordType, onTotalAmountChange]);

    // REMOVED: Auto-population logic for SOID changes

    useEffect(() => {
      if (recordType !== 'Invoice' || mode !== 'new') {
        return;
      }

      const dnidSignature = getIdSignature(dnid);
      if (!dnidSignature) {
        autoPopulateStateRef.current = { ...autoPopulateStateRef.current, dnid: null };

        const currentItems = Array.isArray(fieldArrayRenderProps.value) ? fieldArrayRenderProps.value : [];
        if (currentItems.length > 0) {
          for (let i = currentItems.length - 1; i >= 0; i--) {
            fieldArrayRenderProps.onRemove({ index: i });
          }
          const clearedTotals = calculateTotals([]);
          setTotals(clearedTotals);
          if (onTotalAmountChange) {
            onTotalAmountChange(clearedTotals.totalAmount);
          }
        }
        return;
      }

      if (itemsLoadedFromSessionStorage.current) {
        return;
      }

      if (uninvoicedLoading || !Array.isArray(uninvoicedItems) || uninvoicedItems.length === 0) {
        return;
      }

      const availableLines = uninvoicedItems.filter(line => {
        const quantity = line.quantityDelivered ?? line.quantity ?? 0;
        const alreadyInvoiced = line.invoicedQty ?? line.invoiceQty ?? 0;
        return (quantity - alreadyInvoiced) > 0;
      });

      if (availableLines.length === 0) {
        return;
      }

      const currentItems = Array.isArray(fieldArrayRenderProps.value) ? fieldArrayRenderProps.value : [];
      const previousState = autoPopulateStateRef.current;
      const shouldPopulate = previousState.dnid !== dnidSignature;

      if (!shouldPopulate || autoPopulateRunningRef.current) {
        return;
      }

      console.log('[SalesItems] Auto-populating invoice items from ItemFulfillment:', dnid);

      autoPopulateRunningRef.current = true;
      try {
        // Remove all current rows before auto-populating
        for (let i = currentItems.length - 1; i >= 0; i--) {
          fieldArrayRenderProps.onRemove({ index: i });
        }

        const timestamp = Date.now();
        const newItems = availableLines.map((line, index) => {
          const quantity = line.quantityDelivered ?? line.quantity ?? 0;
          const alreadyInvoiced = line.invoicedQty ?? line.invoiceQty ?? 0;
          const remainingQty = Math.max(0, quantity - alreadyInvoiced);
          const rate = parseFloat(line.rate || 0);
          const taxPercent = parseFloat(line.taxPercent || 0);
          const lineTotal = Math.round(remainingQty * rate * 10000000000) / 10000000000;
          const taxAmount = Math.round(lineTotal * taxPercent / 100 * 100) / 100;
          const totalAmount = Math.round(lineTotal * (1 + (taxPercent / 100)) * 100) / 100;

          return {
            tempId: `auto-${line.id || index}-${timestamp}`,
            itemID: line.itemID,
            itemFulfillmentLineId: line.id || line.itemFulfillmentLineId,
            quantityDelivered: remainingQty,
            rate,
            taxID: line.taxID || '',
            taxPercent,
            taxAmount,
            taxRate: taxAmount,
            totalAmount,
            dnid: line.dnid || (Array.isArray(dnid) ? dnid[0] : dnid)
          };
        });

        newItems.forEach(item => {
          fieldArrayRenderProps.onPush({ value: item });
        });

        autoPopulateStateRef.current = { ...autoPopulateStateRef.current, dnid: dnidSignature };

        setEditIndex(undefined);
        editItemCloneRef.current = undefined;

        const updatedTotals = calculateTotals(newItems);
        setTotals(updatedTotals);
        if (onTotalAmountChange) {
          onTotalAmountChange(updatedTotals.totalAmount);
        }
      } finally {
        autoPopulateRunningRef.current = false;
      }
    }, [
      recordType,
      mode,
      dnid,
      uninvoicedItems,
      uninvoicedLoading,
      fieldArrayRenderProps.value,
      fieldArrayRenderProps.onRemove,
      fieldArrayRenderProps.onPush,
      calculateTotals,
      onTotalAmountChange,
      getIdSignature
    ]);

    useEffect(() => {
      if (recordType !== 'ItemFulfillment' || mode !== 'new') {
        return;
      }

      if (!soid) {
        autoPopulateStateRef.current = { ...autoPopulateStateRef.current, soid: null };
        return;
      }

      // Skip auto population if this record was opened via Fulfill button (session data already applied)
      const sessionData = sessionStorage.getItem('salesOrderDataForFulfillment');
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          const storedSoid = parsed?.soid || parsed?.salesOrderId;
          if (storedSoid && storedSoid === soid) {
            return;
          }
        } catch (err) {
          console.error('[SalesItems] Error parsing session storage for fulfillment:', err);
        }
      }

      if (unfulfilledLoading || !Array.isArray(unfulfilledItems) || unfulfilledItems.length === 0) {
        return;
      }

      const previousState = autoPopulateStateRef.current;
      const shouldPopulate = previousState.soid !== soid;
      if (!shouldPopulate || autoPopulateRunningRef.current) {
        return;
      }

      console.log('[SalesItems] Auto-populating fulfillment items from SalesOrder:', soid);
      autoPopulateRunningRef.current = true;
      try {
        const currentItems = Array.isArray(fieldArrayRenderProps.value) ? fieldArrayRenderProps.value : [];
        for (let i = currentItems.length - 1; i >= 0; i--) {
          fieldArrayRenderProps.onRemove({ index: i });
        }

        const timestamp = Date.now();
        const newItems = unfulfilledItems
          .filter(line => {
            const orderedQty = line.quantity || 0;
            const fulfilledQty = line.fulFillQty || 0;
            return (orderedQty - fulfilledQty) > 0;
          })
          .map((line, index) => {
            const orderedQty = line.quantity || 0;
            const fulfilledQty = line.fulFillQty || 0;
            const remainingQty = Math.max(0, orderedQty - fulfilledQty);
            const rate = parseFloat(line.rate || 0);
            const taxPercent = parseFloat(line.taxPercent || 0);
            const lineTotal = Math.round(remainingQty * rate * 10000000000) / 10000000000;
            const taxAmount = Math.round(lineTotal * taxPercent / 100 * 100) / 100;
            const totalAmount = Math.round(lineTotal * (1 + (taxPercent / 100)) * 100) / 100;

            return {
              tempId: `auto-so-${line.id || index}-${timestamp}`,
              itemID: line.itemID,
              salesOrderLineId: line.id || line.salesOrderLineId,
              quantity: remainingQty,
              rate,
              taxID: line.taxID || '',
              taxPercent,
              taxAmount,
              totalAmount
            };
          });

        newItems.forEach(item => fieldArrayRenderProps.onPush({ value: item }));
        autoPopulateStateRef.current = { ...autoPopulateStateRef.current, soid };

        setEditIndex(undefined);
        editItemCloneRef.current = undefined;

        const updatedTotals = calculateTotals(newItems);
        setTotals(updatedTotals);
        if (onTotalAmountChange) {
          onTotalAmountChange(updatedTotals.totalAmount);
        }
      } finally {
        autoPopulateRunningRef.current = false;
      }
    }, [
      recordType,
      mode,
      soid,
      unfulfilledItems,
      unfulfilledLoading,
      fieldArrayRenderProps.value,
      fieldArrayRenderProps.onRemove,
      fieldArrayRenderProps.onPush,
      calculateTotals,
      onTotalAmountChange
    ]);

    // Add a new item
    const onAdd = useCallback((e) => {
      if (recordType === 'CreditMemo') {
        console.log('[CreditMemo onAdd] CALLED', {
          currentEditIndex: editIndex,
          mode,
          timestamp: new Date().toISOString()
        });
      }

      // Prevent adding items in view mode or when already editing
      if (mode === 'view') {
        if (recordType === 'CreditMemo') {
          console.log('[CreditMemo onAdd] BLOCKED - view mode');
        }
        return;
      }
      e.preventDefault();

      if (editIndex !== undefined) {
        if (recordType === 'CreditMemo') {
          console.log('[CreditMemo onAdd] BLOCKED - already editing', { editIndex });
        }
        return;
      }

      // Check for existing empty items and edit them instead
      const currentItems = Array.isArray(fieldArrayRenderProps.value) ? fieldArrayRenderProps.value : [];
      const emptyItemIndex = currentItems.findIndex(item => !item.itemID);
      if (emptyItemIndex !== -1) {
        if (recordType === 'CreditMemo') {
          console.log('[CreditMemo onAdd] Found empty item, setting editIndex', { emptyItemIndex });
        }
        setEditIndex(emptyItemIndex);
        return;
      }

      // Generate temporary unique ID for client-side tracking (not stored in DB)
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create new item with exact structure matching existing forms
      const newItem = {
        tempId: tempId,  // Client-side unique ID for new items (allows duplicate products)
        // id field will be populated from database after save
        itemID: '',
        rate: 0,
        taxID: '',
        taxPercent: 0,
        totalAmount: 0
      };

      if (recordType === 'Invoice') {
        newItem.quantityDelivered = 1;
        newItem.taxRate = 0;
      } else {
        newItem.quantity = 1;
        newItem.taxAmount = 0;
      }

      console.log('[DEBUG] Adding new item with tempId:', newItem);

      fieldArrayRenderProps.onUnshift({ value: newItem });

      if (recordType === 'CreditMemo') {
        console.log('[CreditMemo onAdd] Setting editIndex to 0 for new item', {
          newItem: { ...newItem },
          timestamp: new Date().toISOString()
        });
      }

      setEditIndex(0);
      // Update totals after adding item
      setTimeout(() => updateTotals(), 0);
    }, [fieldArrayRenderProps, editIndex, recordType, mode, updateTotals]);

    const onRemove = useCallback(async (dataItem) => {
      const index = dataItem[ITEM_DATA_INDEX];

      fieldArrayRenderProps.onRemove({
        index: index
      });
      setEditIndex(undefined);
      editItemCloneRef.current = undefined;

      // Update totals after removing item - use immediate update instead of setTimeout
      const currentItems = fieldArrayRenderProps.value || [];
      const updatedItems = currentItems.filter((_, i) => i !== index);
      const newTotals = calculateTotals(updatedItems);
      setTotals(newTotals);

      // Pass total amount to parent component if callback provided
      if (onTotalAmountChange) {
        onTotalAmountChange(newTotals.totalAmount);
      }
    }, [fieldArrayRenderProps, recordType, soid, dnid, onTotalAmountChange]);

    const onEdit = useCallback((dataItem) => {
      if (recordType === 'CreditMemo') {
        console.log('[CreditMemo onEdit] CALLED', {
          dataItem: { ...dataItem },
          newEditIndex: dataItem[ITEM_DATA_INDEX],
          currentEditIndex: editIndex,
          timestamp: new Date().toISOString()
        });
      }

      editItemCloneRef.current = clone(dataItem);
      setEditIndex(dataItem[ITEM_DATA_INDEX]);
    }, [editIndex]);

    const onCancel = useCallback(() => {
      if (editItemCloneRef.current) {
        fieldArrayRenderProps.onReplace({
          index: editItemCloneRef.current[ITEM_DATA_INDEX],
          value: editItemCloneRef.current
        });
      }
      editItemCloneRef.current = undefined;
      setEditIndex(undefined);
      // Don't update totals when canceling - we're just reverting to original values
      // The totals should remain the same as before the edit started
    }, [fieldArrayRenderProps]);

    const onSave = useCallback((dataItem) => {
      const index = dataItem[ITEM_DATA_INDEX];

      if (recordType === 'CreditMemo') {
        console.log('[CreditMemo onSave] CALLED', {
          index,
          dataItem: { ...dataItem },
          currentEditIndex: editIndex,
          timestamp: new Date().toISOString(),
          stackTrace: new Error().stack
        });
      }

      // Safety check for fieldArrayRenderProps.value
      if (!fieldArrayRenderProps.value || !Array.isArray(fieldArrayRenderProps.value) || !fieldArrayRenderProps.value[index]) {
        console.error('Invalid array access in onSave:', { value: fieldArrayRenderProps.value, index });
        return;
      }

      const currentItem = fieldArrayRenderProps.value[index];

      // Basic validation
      if (!currentItem.itemID) {
        alert('Product is required');
        return;
      }

      const quantityField = recordType === 'Invoice' ? 'quantityDelivered' : 'quantity';
      if (!currentItem[quantityField] || currentItem[quantityField] <= 0) {
        alert('Quantity must be greater than 0');
        return;
      }

      // Perform final calculations before saving - matching SalesOrderForm.js
      const quantity = currentItem[quantityField] === '' ? 0 : parseFloat(currentItem[quantityField]) || 0;
      const rate = currentItem.rate === '' ? 0 : parseFloat(currentItem.rate) || 0;
      const taxID = currentItem.taxID || '';

      // Get tax rate from selected tax - matching SalesOrderForm.js exactly
      let taxPercent = 0;
      if (taxID) {
        const taxOptions = getDropdownProps('taxID');
        const selectedTax = Array.isArray(taxOptions) ? taxOptions.find(tax => tax.value === taxID) : null;
        if (selectedTax && selectedTax.item) {
          // Extract tax rate from tax name if format is like "Tax-30" - matching SalesOrderForm.js
          if (selectedTax.item.taxName && typeof selectedTax.item.taxName === 'string') {
            const rateMatch = selectedTax.item.taxName.match(/-(\d+(?:\.\d+)?)/);
            if (rateMatch) {
              taxPercent = parseFloat(rateMatch[1]);
            }
          }

          // If no rate found from name, use the taxRate field
          if (taxPercent === 0 && selectedTax.item.taxRate) {
            taxPercent = parseFloat(selectedTax.item.taxRate);
          }
        }
      }

      // Calculate using header discount
      // Gross: round to 10 decimals
      const lineTotal = Math.round(quantity * rate * 10000000000) / 10000000000;
  
   
      const subtotal = Math.round((lineTotal) * 100) / 100;
      
      const taxFieldName = recordType === 'Invoice' ? 'taxRate' : 'taxAmount';
      // Tax: round to 2 decimals
      const taxAmount = Math.round(lineTotal * taxPercent / 100 * 100) / 100;
    
      // Net: round to 2 decimals
      const totalAmount = Math.round(lineTotal * (1 + (taxPercent / 100)) * 100) / 100;
   

      // Update the item with calculated values only - don't override user input
      fieldArrayRenderProps.onReplace({
        index: index,
        value: {
          ...currentItem,
          taxPercent: taxPercent,
          [taxFieldName]: taxAmount,
          totalAmount: totalAmount
        }
      });

      if (recordType === 'CreditMemo') {
        console.log('[CreditMemo onSave] Setting editIndex to undefined', {
          timestamp: new Date().toISOString()
        });
      }

      setEditIndex(undefined);
      editItemCloneRef.current = undefined;
      // Update totals after saving item
      setTimeout(() => updateTotals(), 0);
    }, [fieldArrayRenderProps, recordType, getDropdownProps, updateTotals]);

    // Calculate amounts when values change - matching SalesOrderForm.js logic
    React.useEffect(() => {
      if (editIndex !== undefined && fieldArrayRenderProps.value && fieldArrayRenderProps.value[editIndex]) {
        const currentItem = fieldArrayRenderProps.value[editIndex];

        if (recordType === 'CreditMemo') {
          console.log('[CreditMemo AUTO-CALC] useEffect TRIGGERED', {
            editIndex,
            currentItem: { ...currentItem },
            timestamp: new Date().toISOString()
          });
        }

        const quantityField = recordType === 'Invoice' ? 'quantityDelivered' : 'quantity';
        const quantity = currentItem[quantityField] === '' ? 0 : parseFloat(currentItem[quantityField]) || 0;
        const rate = currentItem.rate === '' ? 0 : parseFloat(currentItem.rate) || 0;

        // Calculate line totals (no line-level discount)
        // Gross: round to 10 decimals
        const lineTotal = Math.round(quantity * rate * 10000000000) / 10000000000;
        // Subtotal: round to 2 decimals (same as lineTotal, no discount applied)
        const subtotal = Math.round(lineTotal * 100) / 100;
        const taxPercent = parseFloat(currentItem.taxPercent) || 0;
        // Tax: round to 2 decimals
        const taxAmount = Math.round(lineTotal * taxPercent / 100 * 100) / 100;
        // Net: round to 2 decimals
        const totalAmount = Math.round(lineTotal  * (1 + (taxPercent / 100)) * 100) / 100;

        // Only update if calculations actually changed
        const roundedTaxAmount = Math.round(taxAmount * 100) / 100;
        const roundedTotalAmount = Math.round(totalAmount * 100) / 100;
        const taxFieldName = recordType === 'Invoice' ? 'taxRate' : 'taxAmount';
        const currentTaxAmount = Math.round((parseFloat(currentItem[taxFieldName]) || 0) * 100) / 100;
        const currentTotalAmount = Math.round((parseFloat(currentItem.totalAmount) || 0) * 100) / 100;

        if (roundedTotalAmount !== currentTotalAmount || roundedTaxAmount !== currentTaxAmount) {
          if (recordType === 'CreditMemo') {
            console.log('[CreditMemo AUTO-CALC] UPDATING amounts', {
              editIndex,
              quantity,
              rate,
              taxPercent,
              roundedTaxAmount,
              roundedTotalAmount,
              currentTaxAmount,
              currentTotalAmount,
              timestamp: new Date().toISOString()
            });
          }

          fieldArrayRenderProps.onReplace({
            index: editIndex,
            value: {
              ...currentItem,
              [taxFieldName]: roundedTaxAmount,
              totalAmount: roundedTotalAmount
            }
          });
        } else if (recordType === 'CreditMemo') {
          console.log('[CreditMemo AUTO-CALC] NO UPDATE needed (amounts unchanged)', {
            editIndex,
            roundedTotalAmount,
            currentTotalAmount,
            timestamp: new Date().toISOString()
          });
        }

        // Update tax percentage based on tax selection - matching SalesOrderForm.js exactly
        if (currentItem.taxID) {
          const taxOptions = getDropdownProps('taxID');
          const tax = taxOptions.find(t => t.value === currentItem.taxID);
          if (tax && tax.item) {
            let taxRate = 0;

            // Extract tax rate from tax name if format is like "Tax-30" - matching SalesOrderForm.js
            if (tax.item.taxName && typeof tax.item.taxName === 'string') {
              const rateMatch = tax.item.taxName.match(/-(\d+(?:\.\d+)?)/);
              if (rateMatch) {
                taxRate = parseFloat(rateMatch[1]);
              }
            }

            // If no rate found from name, use the taxRate field - matching SalesOrderForm.js
            if (taxRate === 0 && tax.item.taxRate) {
              taxRate = parseFloat(tax.item.taxRate);
            }

            // Update tax percent if different
            if (taxRate !== parseFloat(currentItem.taxPercent || 0)) {
              if (recordType === 'CreditMemo') {
                console.log('[CreditMemo AUTO-CALC] UPDATING taxPercent', {
                  editIndex,
                  oldTaxPercent: currentItem.taxPercent,
                  newTaxPercent: taxRate,
                  timestamp: new Date().toISOString()
                });
              }

              fieldArrayRenderProps.onReplace({
                index: editIndex,
                value: {
                  ...currentItem,
                  taxPercent: taxRate
                }
              });
            }
          }
        } else if (currentItem.taxPercent > 0) {
          // Clear tax percent if no tax selected
          fieldArrayRenderProps.onReplace({
            index: editIndex,
            value: {
              ...currentItem,
              taxPercent: 0
            }
          });
        }
      }
    }, [editIndex, fieldArrayRenderProps.value, recordType, getDropdownProps, headerDiscount]);

    // REMOVED: Direct auto-population logic for ItemFulfillment

    // REMOVED: Direct auto-population logic for Invoice

    // REMOVED: Auto-population reset useEffect hooks

    const dataWithIndexes = (fieldArrayRenderProps.value || []).map((item, index) => {
      return {
        ...item,
        [ITEM_DATA_INDEX]: index,
        // Use tempId for new items (not yet saved), id for existing items (from DB)
        // This allows duplicate products to be tracked independently
        _uniqueKey: item.tempId || item.id || `index-${index}`
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
        soid,
        selectedLocation,
        unfulfilledItems,
        unfulfilledLoading,
        dnid,
        uninvoicedItems,
        uninvoicedLoading,
        rawSalesOrderLines,
        rawItemFulfillmentLines
      }}>


        {visited && validationMessage && (
          <div className="k-form-error" style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
            {validationMessage}
          </div>
        )}

        {mode !== 'view' && (
          <div
            style={{
              margin: '12px 0 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '0 8px'
            }}
          >
            <Button
              onClick={onAdd}
              themeColor="success"
              fillMode="solid"
              size="medium"
              className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success"
            >
              <FaPlus style={{ marginRight: '6px' }} /> Add Item
            </Button>
            <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#2d3748' }}>
              Total Amount: {(totals.totalAmount).toFixed(2)}
            </div>
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
            dataItemKey="_uniqueKey"
            rowRender={rowRender}
            style={{ height: '400px' }}
          >
            <GridColumn field="itemID" title="Item" cells={{ data: ItemCell }} />
            <GridColumn
              field={recordType === 'Invoice' ? "quantityDelivered" : "quantity"}
              title="Qty"
              width="70px"
              cells={{ data: QuantityCell }}
            />
            {/* Add Fulfilled Qty column for SalesOrder in edit/view mode */}
            {recordType === 'SalesOrder' && (mode === 'edit' || mode === 'view') && (
              <GridColumn
                field="fulFillQty"
                title="FulFill Qty"
                width="90px"
                cells={{ data: FulfilledQtyCell }}
                media="(min-width: 768px)"
              />
            )}
            {/* Add REM Qty column for ItemFulfillment in edit/new mode */}
            {(recordType === 'ItemFulfillment' || recordType === 'Invoice') && (mode === 'edit' || mode === 'new') && (
              <GridColumn
                field="remQty"
                title="REM Qty"
                width="90px"
                cells={{ data: RemQtyCell }}
                media="(min-width: 768px)"
              />
            )}
            {/* Add Invoiced Qty column for ItemFulfillment in edit/view mode */}
            {recordType === 'ItemFulfillment' && (mode === 'edit' || mode === 'view') && (
              <GridColumn
                field="invoicedQty"
                title="Inv Qty"
                width="90px"
                cells={{ data: InvoicedQtyCell }}
                media="(min-width: 992px)"
              />
            )}
            <GridColumn field="rate" title="Rate" width="140px" cells={{ data: RateCell }} />
            <GridColumn field="taxID" title="Tax" width="120px" cells={{ data: TaxCell }} media="(min-width: 768px)" />
            <GridColumn field="taxPercent" title="Tax %" width="80px" cells={{ data: TaxPercentCell }} media="(min-width: 992px)" />
            {recordType === 'Invoice' ? (
              <GridColumn field="taxRate" title="Tax Amt" width="90px" cells={{ data: TaxAmountCell }} />
            ) : (
              <GridColumn field="taxAmount" title="Tax Amt" width="90px" cells={{ data: TaxAmountCell }} media="(min-width: 992px)" />
            )}
            <GridColumn field="totalAmount" title="Amount" width="100px" cells={{ data: TotalAmountCell }} />
            {mode !== 'view' && <GridColumn field="command" title="Actions" width="120px" cells={{ data: CommandCell }} />}
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
        const quantityField = recordType === 'Invoice' ? 'quantityDelivered' : 'quantity';
        if (!item[quantityField] || item[quantityField] <= 0) {
          itemError[quantityField] = 'Quantity must be greater than 0';
        }
        return Object.keys(itemError).length > 0 ? itemError : null;
      }).filter(Boolean);

      if (itemErrors.length > 0) {
        errors.items = 'Please fix item validation errors';
      }
    }

    return errors;
  }, []);

  if (loading || !formConfig || !formInitialized) {
    return (
      <div className="form-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <div>Loading {recordType.toLowerCase()} items...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-container">
        <div className="error-message">
          <h3>Error Loading {recordType} Items</h3>
          <p>{error}</p>
          <Button onClick={() => navigate(navigationPaths[recordType] || '/')}>
            Back to {recordType} List
          </Button>
        </div>
      </div>
    );
  }

  const creditMemoHeaderChecked = invoices.length > 0 && invoices.every((row) => row.checked);

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

        {/* Tab Navigation for Credit Memo */}
        {recordType === 'CreditMemo' && (
          <ApplyTabSwitcher
            activeTab={itemsActiveTab}
            onTabChange={handleItemsTabChange}
            itemsLabel="Add Items"
            applyLabel="Apply Invoice/DebitMemo"
          />
        )}

        {/* Tab Content */}
        {itemsActiveTab === 'items' || recordType !== 'CreditMemo' ? (
          <FieldArray
            name="items"
            component={SalesItemsGrid}
            dataItemKey={DATA_ITEM_KEY}
            validator={(value) => value && value.length ? '' : 'Please add at least one item'}
            onTotalAmountChange={handleTotalAmountChange}
            headerDiscount={headerDiscount}
            selectedLocation={selectedLocation}
            soid={soid}
            dnid={dnid}
            onUnfulfilledLinesLoaded={onUnfulfilledLinesLoaded}
          />
        ) : (
          <CreditMemoApplyTab
            mode={mode}
            invoices={invoices}
            creditAmount={parseAmount(creditAmountStr)}
            appliedTo={appliedTo}
            unapplied={unapplied}
            loading={creditLoading}
            onClearAll={onClearAll}
            onHeaderToggle={onHeaderInvToggle}
            onInvoiceCheck={onInvCheckChange}
            onInvoiceApplyChange={onInvApplyChange}
            onInvoiceApplyFocus={onInvApplyFocus}
            onInvoiceApplyBlur={onInvApplyBlur}
            headerChecked={creditMemoHeaderChecked}
          />
        )}
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

      {recordType === 'CreditMemo' && (
        <ApplyTabSwitcher
          activeTab={itemsActiveTab}
          onTabChange={handleItemsTabChange}
          applyLabel="Apply Invoice/DebitMemo"
        />
      )}

      <Form
        onSubmit={handleSubmit}
        initialValues={formData}
        render={(formRenderProps) => (
          <FormElement style={{ width: '100%' }}>
            {/* Hidden field to store session storage items for ItemFulfillment restriction */}
            <div className="form-grid">
              <div className="order-items-field">
                {/* Tab Content */}
                {itemsActiveTab === 'items' || recordType !== 'CreditMemo' ? (
                  <FieldArray
                    name="items"
                    component={SalesItemsGrid}
                    dataItemKey={DATA_ITEM_KEY}
                    validator={(value) => value && value.length ? '' : 'Please add at least one item'}
                    onTotalAmountChange={handleTotalAmountChange}
                    headerDiscount={headerDiscount}
                    selectedLocation={selectedLocation}
                    soid={soid}
                    dnid={dnid}
                    onUnfulfilledLinesLoaded={onUnfulfilledLinesLoaded}
                  />
                ) : (
                  <CreditMemoApplyTab
                    mode={mode}
                    invoices={invoices}
                    creditAmount={parseAmount(creditAmountStr)}
                    appliedTo={appliedTo}
                    unapplied={unapplied}
                    loading={creditLoading}
                    onClearAll={onClearAll}
                    onHeaderToggle={onHeaderInvToggle}
                    onInvoiceCheck={onInvCheckChange}
                    onInvoiceApplyChange={onInvApplyChange}
                    onInvoiceApplyFocus={onInvApplyFocus}
                    onInvoiceApplyBlur={onInvApplyBlur}
                    headerChecked={creditMemoHeaderChecked}
                  />
                )}
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

        /* Tab Navigation Styles */
        .tab-navigation {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #e8eaed;
          margin-bottom: 0;
          background: transparent;
          padding: 0;
          margin-top: 20px;
        }

        .tab-buttons {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #e8eaed;
          margin-bottom: 0;
          background: transparent;
          padding: 0;
        }

        .tab-button {
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

        .tab-button:hover {
          background: #e8f0fe;
          color: #1a73e8;
        }

        .tab-button.active {
          background: white;
          color: #1a73e8;
          border-bottom: 2px solid white;
          margin-bottom: -2px;
          font-weight: 700;
        }

        /* Credit Apply Styles */
        .credit-apply-container {
          padding: 0;
          background: transparent;
          margin-bottom: 20px;
        }

        .credit-header {
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
        }

        .credit-header h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
        }

        .credit-description {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
          line-height: 1.4;
        }

        .credit-summary-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 24px;
          overflow: hidden;
          border: 1px solid #e8e8e8;
        }

        .summary-row {
          display: flex;
          align-items: center;
          padding: 24px;
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
        }

        .summary-item {
          flex: 1;
          text-align: center;
          padding: 0 16px;
        }

        .summary-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .summary-value {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .credit-amount {
          color: #3b82f6;
          text-shadow: 0 1px 2px rgba(59, 130, 246, 0.1);
        }

        .applied-amount {
          color: #10b981;
          text-shadow: 0 1px 2px rgba(16, 185, 129, 0.1);
        }

        .remaining-amount {
          color: #f59e0b;
          text-shadow: 0 1px 2px rgba(245, 158, 11, 0.1);
        }

        .summary-divider {
          width: 1px;
          height: 50px;
          background: linear-gradient(to bottom, transparent, #cbd5e1, transparent);
          margin: 0 20px;
        }

        .credit-actions {
          margin-bottom: 24px;
          text-align: right;
        }
        
        .credit-actions .k-button {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          color: white;
          font-weight: 500;
          padding: 12px 24px;
          border-radius: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
        
        .credit-actions .k-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        }  justify-content: flex-end;
        }

        .credit-application-table {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
          border: 1px solid #e8e8e8;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
{{ ... }}

        .modern-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .modern-table th {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          padding: 18px 16px;
          text-align: left;
          font-weight: 600;
          color: #334155;
          border-bottom: 2px solid #cbd5e1;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .modern-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          transition: background-color 0.15s ease;
        }

        .modern-table tr:hover {
          background-color: #f8fafc;
        }

        .modern-table tr.selected {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
        }

        .modern-table tbody tr.selected-row {
          background: #e3f2fd;
        }
{{ ... }}
        .credit-input {
          text-align: right;
        }

        .type-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 24px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .type-badge.invoice {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .type-badge.debit-memo {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .no-data-message {
          text-align: center;
          padding: 40px;
{{ ... }}
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message, .no-data-message {
          text-align: center;
          padding: 48px 40px;
          color: #64748b;
          background: linear-gradient(135deg, #fef2f2 0%, #fdf2f8 100%);
          border-radius: 12px;
          margin: 20px 0;
          border: 1px solid #fecaca;
        }
        
        .no-data-message {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
        }#ffcdd2;
        }

        .form-header {
          margin-bottom: 16px;
          display: flex;
{{ ... }}

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          .loading-indicator {
          text-align: center;
          padding: 60px 40px;
          color: #64748b;
          background: #f8fafc;
          border-radius: 12px;
          margin: 20px 0;
        }

        .spinner {
          border: 3px solid #e2e8f0;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
{{ ... }}
        }

        .k-form-error {
          color: #e53e3e;
          font-size: 12px;
          margin-top: 4px;
        }

        /* Grid specific styles for consistent field sizing */
        .k-grid td {
          padding: 0 !important;
        }

        .k-grid .k-textbox,
        .k-grid .k-dropdownlist,
        .k-grid input[type="number"] {
          height: 32px !important;
          font-size: 13px !important;
          padding: 4px 8px !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 3px !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .k-grid .k-dropdownlist .k-input {
          height: 30px !important;
          padding: 4px 8px !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
        }

        /* Hide number input spinners */
        .k-grid input[type="number"]::-webkit-outer-spin-button,
        .k-grid input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }

        .k-grid input[type="number"] {
          -moz-appearance: textfield !important;
        }

        /* Transaction Items Grid Styles - Based on FormCreator.js */
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
          -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
          display: block !important;
        }

        .transaction-items-grid {
          border: none !important;
          border-radius: 0 !important;
          margin-bottom: 0 !important;
          min-width: 900px !important;
          width: auto !important;
        }

        /* Remove fixed width constraints for responsive design */
        .transaction-items-grid {
          width: 100% !important;
          min-width: unset !important;
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

        .transaction-items-grid .k-grid-header th:last-child {
          text-align: center !important;
        }

        .transaction-items-grid td {
          padding: 8px !important;
          border-bottom: 1px solid #f0f0f0 !important;
          vertical-align: middle !important;
        }

        .transaction-items-grid td:last-child {
          text-align: center !important;
        }

        .transaction-items-grid .k-grid-content tr:hover {
          background-color: #f7fafc !important;
        }

        /* Responsive Grid Layout */
        .transaction-items-grid .k-grid-table {
          width: 100% !important;
        }

        /* Responsive Grid Layout */
        .transaction-items-grid .k-grid-table {
          width: 100% !important;
        }

        /* Responsive container behavior */
        .transaction-items-grid-container {
          overflow-x: auto !important;
          overflow-y: visible !important;
        }

        /* Always show horizontal scroll on mobile */
        @media (max-width: 768px) {
          .transaction-items-grid-container {
            overflow-x: scroll !important;
            overflow-y: visible !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: auto !important;
          }
          
          .transaction-items-grid {
            min-width: 1200px !important;
            width: 1200px !important;
          }
          
          .transaction-items-grid .k-grid-table {
            min-width: 1200px !important;
            width: 1200px !important;
            table-layout: fixed !important;
          }
          
          /* Set specific column widths to ensure overflow */
          .transaction-items-grid .k-grid-header th:nth-child(1),
          .transaction-items-grid td:nth-child(1) {
            width: 200px !important;
            min-width: 200px !important;
          }
          
          .transaction-items-grid .k-grid-header th:nth-child(2),
          .transaction-items-grid td:nth-child(2) {
            width: 100px !important;
            min-width: 100px !important;
          }
          
          .transaction-items-grid .k-grid-header th:nth-child(3),
          .transaction-items-grid td:nth-child(3) {
            width: 120px !important;
            min-width: 120px !important;
          }
          
          .transaction-items-grid .k-grid-header th:nth-child(4),
          .transaction-items-grid td:nth-child(4) {
            width: 120px !important;
            min-width: 120px !important;
          }
          
          .transaction-items-grid .k-grid-header th:nth-child(5),
          .transaction-items-grid td:nth-child(5) {
            width: 150px !important;
            min-width: 150px !important;
          }
          
          .transaction-items-grid .k-grid-header th:nth-child(6),
          .transaction-items-grid td:nth-child(6) {
            width: 100px !important;
            min-width: 100px !important;
          }
          
          .transaction-items-grid .k-grid-header th:nth-child(7),
          .transaction-items-grid td:nth-child(7) {
            width: 120px !important;
            min-width: 120px !important;
          }
          
          .transaction-items-grid .k-grid-header th:nth-child(8),
          .transaction-items-grid td:nth-child(8) {
            width: 120px !important;
            min-width: 120px !important;
          }
          
          .transaction-items-grid .k-grid-header th:nth-child(9),
          .transaction-items-grid td:nth-child(9) {
            width: 150px !important;
            min-width: 150px !important;
          }
        }

        /* Horizontal scroll indicator for mobile */
        .transaction-items-grid-container::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 20px;
          height: 100%;
          background: linear-gradient(to left, rgba(255,255,255,0.8), transparent);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        /* Form container responsive fixes */
        body, html {
          overflow-x: hidden;
        }

        .form-container, .master-form-container {
          max-width: 100vw;
          overflow-x: hidden;  
          box-sizing: border-box;
        }

        .master-form-content {
          max-width: 100%;
          overflow-x: hidden;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .order-items-field {
            grid-column: span 1;
          }

          .form-container {
            margin: 12px;
            padding: 12px;
          }

          .transaction-items-grid-container {
            margin: 0 -16px;
            border-radius: 0;
            border-left: none;
            border-right: none;
            position: relative;
            /* Enhanced horizontal scrolling */
            overflow-x: auto;
            overflow-y: visible;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e0 #f7fafc;
          }

          /* Custom scrollbar for webkit browsers */
          .transaction-items-grid-container::-webkit-scrollbar {
            height: 6px;
          }

          .transaction-items-grid-container::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 3px;
          }

          .transaction-items-grid-container::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 3px;
          }

          .transaction-items-grid-container::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }

          /* Show scroll indicator when content overflows */
          .transaction-items-grid-container::after {
            opacity: 1;
          }

          .transaction-items-grid .k-grid-table {
            min-width: 800px; /* Ensure all columns are visible with horizontal scroll */
          }

          /* Add padding to prevent content cutoff */
          .transaction-items-grid .k-grid-header th:first-child,
          .transaction-items-grid td:first-child {
            padding-left: 12px !important;
          }

          .transaction-items-grid .k-grid-header th:last-child,
          .transaction-items-grid td:last-child {
            padding-right: 12px !important;
          }
        }

        @media (max-width: 480px) {
          .transaction-items-grid-container {
            margin: 0 -12px;
          }

          .transaction-items-grid .k-grid-table {
            min-width: 700px; /* Slightly smaller for very small screens */
          }

          /* Compress column widths for mobile */
          .transaction-items-grid .k-grid-header th,
          .transaction-items-grid td {
            padding: 6px 4px !important;
            font-size: 12px !important;
          }

          .transaction-items-grid .k-textbox,
          .transaction-items-grid .k-dropdownlist,
          .transaction-items-grid input[type="number"] {
            height: 28px !important;
            font-size: 12px !important;
            padding: 2px 6px !important;
          }
        }
      `}</style>
    </div>
  );
});

export const SalesOrderItems = (props) => <SalesItems {...props} recordType="SalesOrder" />;
export const ItemFulfillmentItems = (props) => <SalesItems {...props} recordType="ItemFulfillment" />;
export const InvoiceItems = (props) => <SalesItems {...props} recordType="Invoice" />;
export const CreditMemoItems = (props) => <SalesItems {...props} recordType="CreditMemo" />;

export default SalesItems; 
