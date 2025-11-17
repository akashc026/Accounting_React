import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

const PurchaseItems = React.memo(({ recordType, mode = 'new', embedded = false, onTotalAmountChange, headerDiscount = 0, selectedLocation, poid = null, irid = null, onUnreceivedLinesLoaded = null, vendorId = null, onCreditApplicationChange = null, originalRecordLineItems = [] }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { loading: dynamicLoading, error: dynamicError, fetchFormConfiguration } = useDynamicForm();
  const { getProductPurchasePriceTaxCode } = useInventoryDetail();

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [dropdownData, setDropdownData] = useState({});
  const [formInitialized, setFormInitialized] = useState(false);

  // Vendor Credit Apply functionality states
  const [activeTab, setActiveTab] = useState('items');
  const [creditAmountStr, setCreditAmountStr] = useState('');
  const [vendorBills, setVendorBills] = useState([]);
  const [appliedTo, setAppliedTo] = useState(0);
  const [unapplied, setUnapplied] = useState(0);
  const [creditLoading, setCreditLoading] = useState(false);
  const lockSeqRef = useRef(1);
  const editCtxRef = useRef(new Map());
  const isInitialLoadRef = useRef(true);
  const originalPaymentLinesRef = useRef(null);

  // Purchase Order selection state for ItemReceipt
  const [unreceivedLines, setUnreceivedLines] = useState([]);
  const [isRestrictedToUnreceived, setIsRestrictedToUnreceived] = useState(false);

  // ItemReceipt selection state for VendorBill
  const [unbilledItems, setUnbilledItems] = useState([]);
  const [unbilledLoading, setUnbilledLoading] = useState(false);

  // Store raw/original purchase order lines (without modifications) for RemQty calculation
  const [rawPurchaseOrderLines, setRawPurchaseOrderLines] = useState([]);
  // Store raw/original item receipt lines (without modifications) for RemQty calculation
  const [rawItemReceiptLines, setRawItemReceiptLines] = useState([]);

  // Transaction items navigation
  const navigationPaths = {
    PurchaseOrder: '/purchase-order',
    ItemReceipt: '/item-receipt',
    VendorBill: '/vendor-bill',
    VendorCredit: '/vendor-credit'
  };

  // Get transaction-specific item configurations - matching exact field names from existing forms
  const getItemConfiguration = useCallback((transactionType) => {
    switch (transactionType) {
      case 'PurchaseOrder':
        return {
          title: 'Items',
          fields: ['itemID', 'quantity', 'receivedQty', 'rate', 'taxID', 'taxPercent', 'taxAmount', 'totalAmount']
        };

      case 'ItemReceipt':
        return {
          title: 'Items',
          fields: ['itemID', 'quantityReceived', 'remQty', 'rate', 'taxID', 'taxPercent', 'taxAmount', 'totalAmount']
        };

      case 'VendorBill':
        return {
          title: 'Items',
          fields: ['itemID', 'quantity', 'rate', 'taxID', 'taxPercent', 'taxAmount', 'totalAmount']
        };

      case 'VendorCredit':
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

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  }, []);

  // Vendor Credit Apply functionality - copied from SalesItems.js credit memo logic
  const parseAmount = (v) => {
    const n = parseFloat(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

  // Build initial rows from API data (oldest-first) - for vendor bills
  const buildInitialVendorBills = (vendorBillData = []) => {
    // Process vendor bills
    const processedVendorBills = vendorBillData
      .filter(vb => {
        // Only show open status vendor bills (amountDue > 0)
        const amountDue = parseAmount(vb.amountDue || vb.totalAmount);
        return amountDue > 0;
      })
      .map((vb) => {
        // Convert API date format (2025-08-25T00:00:00) to DD/MM/YYYY with proper validation
        let formattedDate = 'N/A';
        let dateKey = 0;

        if (vb.invoiceDate) {
          const apiDate = new Date(vb.invoiceDate);
          if (!isNaN(apiDate.getTime())) {
            formattedDate = `${apiDate.getDate().toString().padStart(2, '0')}/${(apiDate.getMonth() + 1).toString().padStart(2, '0')}/${apiDate.getFullYear()}`;
            dateKey = apiDate.getTime();
          }
        }

        return {
          id: vb.id,
          date: formattedDate,
          dateKey: dateKey,
          type: "Vendor Bill",
          refNo: vb.sequenceNumber,
          dueAmount: parseAmount(vb.amountDue || vb.totalAmount),
          originalAmount: parseAmount(vb.totalAmount),
          displayAmount: 0,
          checked: false,
          userTyped: false,
          lockedSeq: null,
          disabled: false,
        };
      });

    // Sort by date (oldest first)
    return processedVendorBills.sort((a, b) => a.dateKey - b.dateKey);
  };

  // Fetch vendor bills from API
  const fetchVendorBills = useCallback(async (vendorIdParam, locationIdParam) => {
    console.log('🔍 fetchVendorBills called with:', { vendorIdParam, locationIdParam });

    // Require BOTH vendor AND location
    if (!vendorIdParam || !locationIdParam) {
      console.log('❌ fetchVendorBills: Missing required parameters, returning empty array');
      return [];
    }

    try {
      const url = buildUrl(apiConfig.endpoints.vendorBillByVendorAndLocation(vendorIdParam, locationIdParam));
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

      return await response.json();
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

  // Handle total amount changes from the items grid
  const handleTotalAmountChange = useCallback((newTotal) => {
    if (recordType === 'VendorCredit') {
      const newCreditAmountStr = newTotal.toString();
      // Only update if the credit amount string actually changed
      if (creditAmountStr !== newCreditAmountStr) {
        setCreditAmountStr(newCreditAmountStr);
        // Only recalculate if we have vendor bills loaded
        if (vendorBills && vendorBills.length > 0) {
          recalc({ creditAmountStr: newCreditAmountStr });
        }
      }
    }

    // Call parent callback if provided
    if (onTotalAmountChange) {
      onTotalAmountChange(newTotal);
    }
  }, [recordType, onTotalAmountChange, creditAmountStr, vendorBills]);

  // Send credit application data to parent component
  useEffect(() => {
    if (onCreditApplicationChange && recordType === 'VendorCredit') {
      const creditData = {
        creditAmount: creditAmountStr,
        vendorBills: vendorBills,
        appliedTo: appliedTo,
        unapplied: unapplied,
        originalData: originalPaymentLinesRef.current // Include original data for edit mode calculations
      };
      onCreditApplicationChange(creditData);
    }
  }, [creditAmountStr, vendorBills, appliedTo, unapplied, recordType]);

  // Fetch Vendor Credit Payment Lines for edit/view modes
  const fetchVendorCreditPaymentLines = useCallback(async (vendorCreditId) => {
    try {
      const response = await fetch(`${apiConfig.baseURL}/vendor-credit-payment-line/by-vendor-credit/${vendorCreditId}`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const paymentLines = Array.isArray(data) ? data : data.lines || data.results || [];
        return paymentLines;
      }
      return [];
    } catch (error) {
      console.error('Error fetching vendor credit payment lines:', error);
      return [];
    }
  }, []);

  // Build initial vendor bills with payment line data for edit/view modes
  const buildInitialVendorBillsWithPaymentData = useCallback(async (vendorBillData = [], paymentLines = []) => {
    // Create a map for quick lookup of payment lines by recordID
    console.log(JSON.stringify(vendorBillData))
    console.log(JSON.stringify(paymentLines))
    const paymentLineMap = new Map();
    paymentLines.forEach(line => paymentLineMap.set(line.recordID, line));

    // Helper function to process a single vendor bill
    const processVendorBill = (vb, paymentLine) => {
      // Convert API date format with proper validation
      let formattedDate = 'N/A';
      let dateKey = 0;

      if (vb.invoiceDate) {
        const apiDate = new Date(vb.invoiceDate);
        if (!isNaN(apiDate.getTime())) {
          formattedDate = `${apiDate.getDate().toString().padStart(2, '0')}/${(apiDate.getMonth() + 1).toString().padStart(2, '0')}/${apiDate.getFullYear()}`;
          dateKey = apiDate.getTime();
        }
      }

      return {
        id: vb.id,
        date: formattedDate,
        dateKey: dateKey,
        type: "Vendor Bill",
        refNo: vb.sequenceNumber,
        dueAmount: parseAmount(vb.amountDue || vb.totalAmount),
        originalAmount: parseAmount(vb.totalAmount),
        // Payment line data
        displayAmount: paymentLine ? paymentLine.paymentAmount : 0,
        originalDisplayAmount: paymentLine ? paymentLine.paymentAmount : 0,
        checked: paymentLine ? paymentLine.isApplied : false,
        userTyped: !!paymentLine,
        lockedSeq: null,
        disabled: mode === 'view'
      };
    };

    // Process existing vendor bills from vendorBillData (Open bills)
    const processedVendorBills = vendorBillData.map((vb) => {
      const paymentLine = paymentLineMap.get(vb.id);
      return processVendorBill(vb, paymentLine);
    });

    // Create a set of vendor bill IDs that already exist in vendorBillData
    const existingVendorBillIds = new Set(vendorBillData.map(vb => vb.id));

    // Fetch vendor bills from payment lines that are NOT in vendorBillData (closed/fully paid bills)
    const additionalVendorBills = [];
    for (const paymentLine of paymentLines) {
      const recordID = paymentLine.recordID;

      // Skip if this vendor bill already exists in vendorBillData
      if (existingVendorBillIds.has(recordID)) {
        continue;
      }

      try {
        // Fetch the vendor bill by ID
        const response = await fetch(buildUrl(`/vendor-bill/${recordID}`), {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const vendorBill = await response.json();
          // Process this vendor bill with its payment line data
          const processedBill = processVendorBill(vendorBill, paymentLine);
          additionalVendorBills.push(processedBill);
          console.log(`✅ Fetched closed vendor bill (ID: ${recordID}) from payment line`);
        } else {
          console.warn(`⚠️ Could not fetch vendor bill with ID ${recordID}: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching vendor bill with ID ${recordID}:`, error);
      }
    }

    // Merge processed vendor bills with additional vendor bills from payment lines
    let allVendorBills = [...processedVendorBills, ...additionalVendorBills];

    // Sort by date (oldest first)
    allVendorBills = allVendorBills.sort((a, b) => a.dateKey - b.dateKey);

    // In view mode, show only applied records
    if (mode === 'view') {
      allVendorBills = allVendorBills.filter(vb => vb.checked && vb.displayAmount > 0);
    }

    return allVendorBills;
  }, [mode]);

  // Fetch credit application data when vendorId and location change
  useEffect(() => {
    const fetchCreditData = async () => {
      // Require BOTH vendor AND location for Vendor Credit
      if (recordType !== 'VendorCredit' || !vendorId || !selectedLocation) {
        console.log('⚠️ Vendor Credit: Missing required parameters', {
          recordType,
          vendorId,
          selectedLocation
        });
        setVendorBills([]);
        return;
      }

      setCreditLoading(true);

      try {
        const vendorBillData = await fetchVendorBills(vendorId, selectedLocation);

        let processedVendorBills;

        // For edit/view modes, fetch payment lines and merge data
        if ((mode === 'edit' || mode === 'view') && id) {
          const paymentLines = await fetchVendorCreditPaymentLines(id);

          // Store original payment lines for edit mode difference calculations
          if (mode === 'edit') {
            originalPaymentLinesRef.current = { lines: paymentLines };
            console.log('Stored original payment lines for edit mode:', originalPaymentLinesRef.current);
          }

          processedVendorBills = await buildInitialVendorBillsWithPaymentData(vendorBillData, paymentLines);
        } else {
          // For new mode, use regular processing
          processedVendorBills = buildInitialVendorBills(vendorBillData);
        }

        
        // Mark as initial load to prevent auto-save
        isInitialLoadRef.current = true;
        setVendorBills(processedVendorBills);

      } catch (err) {
        console.error('❌ Error fetching vendor credit data:', err);
        setVendorBills([]);
      } finally {
        setCreditLoading(false);
      }
    };

    fetchCreditData();
  }, [vendorId, selectedLocation, recordType, mode, id, fetchVendorBills, fetchVendorCreditPaymentLines, buildInitialVendorBillsWithPaymentData]);

  // Get cash unapplied
  const getCashUnapplied = () => unapplied;

  const updateCheckboxDisabling = (nextVendorBills, nextUnapplied) => {
    const capacity = nextUnapplied;

    return nextVendorBills.map((row) => {
      const applied = row.displayAmount;
      const disabled = applied === 0 && capacity <= 0;
      return { ...row, disabled };
    });
  };

  // Core allocation engine (recalc) - adapted for vendor bills
  const recalc = (opt) => {
    const creditLimit = parseAmount(
      opt?.creditAmountStr ?? creditAmountStr
    );
    let cashAvail = creditLimit;

    const currVendorBills = opt?.vendorBills ?? vendorBills;

    // If no vendor bills available, don't proceed with recalculation
    if (!currVendorBills || currVendorBills.length === 0) {
      return;
    }

    // Build vendor bill models
    const billModels = currVendorBills.map((row) => {
      const typedOrder = row.userTyped ? row.lockedSeq ?? Infinity : Infinity;
      const currentDisplayed = row.displayAmount;

      // In edit mode, use enhanced limit (dueAmount + originalDisplayAmount)
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
    const typedList = billModels
      .filter((r) => r.typedRequested > 0)
      .sort(
        (a, b) =>
          (a.typedOrder - b.typedOrder) || (a.dateKey - b.dateKey)
      );

    for (const bill of typedList) {
      let target = bill.typedRequested;

      const cashUsed = Math.min(target, cashAvail);
      bill.appliedCash += cashUsed;
      cashAvail -= cashUsed;
    }

    // Phase B: preserve existing non-typed ("sticky") oldest-first
    const stickyList = billModels
      .filter((r) => r.typedRequested === 0 && r.stickyRequested > 0)
      .sort((a, b) => a.dateKey - b.dateKey);

    for (const bill of stickyList) {
      const already = bill.appliedCash;
      let target = Math.max(bill.stickyRequested - already, 0);

      if (target <= 0) continue;

      const cashUsed = Math.min(target, cashAvail);
      bill.appliedCash += cashUsed;
      cashAvail -= cashUsed;
    }

    // Phase C: allocate remainder to newly-checked & empty (oldest-first)
    const autoList = billModels
      .filter(
        (r) =>
          r.typedRequested === 0 &&
          r.stickyRequested === 0 &&
          r.checked === true
      )
      .sort((a, b) => a.dateKey - b.dateKey);

    for (const bill of autoList) {
      const already = bill.appliedCash;
      const stillDue = Math.max(bill.dueAmount - already, 0);

      if (stillDue <= 0) continue;

      let target = stillDue;

      const cashUsed = Math.min(target, cashAvail);
      bill.appliedCash += cashUsed;
      cashAvail -= cashUsed;
    }

    // Update vendor bills
    let totalAppliedToBills = 0;
    const nextVendorBills = currVendorBills.map((row) => {
      const m = billModels.find((x) => x.id === row.id);
      const total = m.appliedCash;
      totalAppliedToBills += total;
      return {
        ...row,
        displayAmount: total,
        checked: total > 0,
        appliedCash: m.appliedCash,
      };
    });

    // Totals
    const nextUnapplied = Math.max(creditLimit - totalAppliedToBills, 0);

    // Disable checkboxes if no capacity left and row has 0 applied
    const disabledVendorBills = updateCheckboxDisabling(
      nextVendorBills,
      nextUnapplied
    );

    // Commit state
    setVendorBills(disabledVendorBills);
    setAppliedTo(totalAppliedToBills);
    setUnapplied(nextUnapplied);
  };

  // Handlers for vendor credit apply tab
  const onCreditAmountChange = (e) => {
    const value = e.target ? e.target.value : (e.value?.toString() || '');
    setCreditAmountStr(value);
    recalc({ creditAmountStr: value });
  };

  const onClearAll = () => {
    const clearedBills = vendorBills.map((r) => ({
      ...r,
      displayAmount: 0,
      checked: false,
      userTyped: false,
      lockedSeq: null,
    }));
    setVendorBills(clearedBills);
    setAppliedTo(0);
    setUnapplied(parseAmount(creditAmountStr));
  };

  const onHeaderBillToggle = () => {
    const allChecked = vendorBills.length > 0 && vendorBills.every((r) => r.checked);

    // Validate credit amount before allowing checkbox selection (only when checking)
    const creditAmount = parseAmount(creditAmountStr);
    if (!allChecked && (creditAmount === 0 || !creditAmountStr || creditAmountStr === '')) {
      alert('Please enter a Credit Amount before selecting transactions.');
      return;
    }

    const nextVendorBills = vendorBills.map((r) => ({ ...r, checked: !allChecked, userTyped: false }));
    recalc({ vendorBills: nextVendorBills });
  };

  const onBillCheckChange = (id, checked) => {
    // Validate credit amount before allowing checkbox selection (only when checking)
    const creditAmount = parseAmount(creditAmountStr);
    if (checked && (creditAmount === 0 || !creditAmountStr || creditAmountStr === '')) {
      alert('Please enter a Credit Amount before selecting transactions.');
      return;
    }

    const nextVendorBills = vendorBills.map((r) => {
      if (r.id !== id) return r;

      if (!checked) {
        // When unchecking, clear the amount
        return {
          ...r,
          checked: false,
          displayAmount: 0,
          userTyped: false
        };
      } else {
        // When checking, let recalc handle the allocation
        return {
          ...r,
          checked: true,
          displayAmount: 0,  // Clear amount so it goes to auto allocation
          userTyped: false
        };
      }
    });

    // Prevent auto-save during user interaction
    isInitialLoadRef.current = true;
    recalc({ vendorBills: nextVendorBills });
  };

  const onBillApplyChange = (id, value) => {
    const nextVendorBills = vendorBills.map((r) => {
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

    // Prevent auto-save during user interaction
    isInitialLoadRef.current = true;
    recalc({ vendorBills: nextVendorBills });
  };

  const onBillApplyFocus = (id) => {
    const row = vendorBills.find((r) => r.id === id);
    if (row) {
      editCtxRef.current.set(id, {
        startCents: row.displayAmount,
        unappliedAtFocusCents: unapplied,
      });
    }
  };

  const onBillApplyBlur = (id) => {
    editCtxRef.current.delete(id);
  };

  // Create Vendor Credit Payment Lines API calls
  const createVendorCreditPaymentLines = useCallback(async (vendorCreditId, appliedVendorBills) => {
    if (!vendorCreditId || !appliedVendorBills || appliedVendorBills.length === 0) {
      return;
    }

    const createPromises = appliedVendorBills
      .filter(bill => bill.checked && bill.displayAmount > 0)
      .map(async (bill) => {
        const paymentLineData = {
          id: null, // Let backend generate
          paymentAmount: bill.displayAmount,
          recordID: bill.id,
          isApplied: true,
          refNo: bill.refNo,
          recordType: bill.type,
          vcid: vendorCreditId,
          paymentSeqNum: null, // Will be set by backend
          mainRecordAmount: bill.originalAmount
        };

        try {
          const response = await fetch(buildUrl('/vendor-credit-payment-line'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(cleanPayload(paymentLineData))
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to create vendor credit payment line: ${response.status} - ${errorData}`);
          }

          return await response.json();
        } catch (error) {
          console.error('Error creating vendor credit payment line:', error);
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
    if (recordType !== 'VendorCredit' || !id) {
      return;
    }

    try {
      setCreditLoading(true);
      await createVendorCreditPaymentLines(id, vendorBills);
    } catch (error) {
      console.error('Error saving credit applications:', error);
    } finally {
      setCreditLoading(false);
    }
  }, [recordType, id, vendorBills, createVendorCreditPaymentLines]);

  // Function to fetch unreceived purchase order lines for ItemReceipt
  const fetchUnreceivedPurchaseOrderLines = useCallback(async (purchaseOrderId) => {
    console.log('[PurchaseItems] fetchUnreceivedPurchaseOrderLines called with:', purchaseOrderId);
    if (!purchaseOrderId) {
      setUnreceivedLines([]);
      setIsRestrictedToUnreceived(false);
      return;
    }

    try {
      const url = `${apiConfig.baseURL}/purchase-order-line/by-purchase-order/${purchaseOrderId}`;
      console.log('[PurchaseItems] Fetching from URL:', url);
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      console.log('[PurchaseItems] Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('[PurchaseItems] 404 - No PO lines found');
          setUnreceivedLines([]);
          setIsRestrictedToUnreceived(false);
          return;
        }
        throw new Error(`Failed to fetch unreceived items: ${response.status}`);
      }

      const data = await response.json();
      console.log('[PurchaseItems] Raw data from API:', data);
      // Handle both new format (direct array) and old format (results property)
      const unreceivedItems = Array.isArray(data) ? data : (data.lines || data.results || []);
      console.log('[PurchaseItems] Parsed unreceived items:', unreceivedItems);

      // Store the RAW purchase order lines for RemQty calculation (without any modifications)
      const getUnreceived = unreceivedItems.filter(item => (Number(item.quantity || 0) - Number(item.receivedQty || 0)) > 0);
      console.log('[PurchaseItems] Filtered unreceived items (qty - receivedQty > 0):', getUnreceived);
      setRawPurchaseOrderLines(getUnreceived);
      console.log('[PurchaseItems] Stored raw purchase order lines for RemQty:', getUnreceived);

      setUnreceivedLines(getUnreceived);
      setIsRestrictedToUnreceived(getUnreceived.length > 0);
    } catch (error) {
      setUnreceivedLines([]);
      setIsRestrictedToUnreceived(false);
      showNotification(`Failed to load unreceived items: ${error.message}`, 'error');
    }
  }, [showNotification]);

  // Fetch unbilled ItemReceipt lines for VendorBill
  const fetchUnbilledItemReceiptLines = useCallback(async (itemReceiptId) => {
    if (!itemReceiptId || recordType !== 'VendorBill') {
      return [];
    }

    try {
      setUnbilledLoading(true);
      const url = buildUrl(`/item-receipt-line/uninvoiced?IRID=${itemReceiptId}`);
      console.log('[PurchaseItems] Fetching unbilled lines from:', url);

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unbilled item receipt lines: ${response.status}`);
      }

      const data = await response.json();
      const unbilledLines = data.lines || data.results || data || [];
      console.log('[PurchaseItems] Fetched unbilled lines:', unbilledLines);

      // Store the RAW item receipt lines for RemQty calculation (without any modifications)
      setRawItemReceiptLines(unbilledLines);
      console.log('[PurchaseItems] Stored raw item receipt lines for RemQty:', unbilledLines);

      setUnbilledItems(unbilledLines);
      return unbilledLines;
    } catch (err) {
      console.error('Error fetching unbilled item receipt lines:', err);
      showNotification(`Error fetching unbilled lines: ${err.message}`, 'error');
      setUnbilledItems([]);
      return [];
    } finally {
      setUnbilledLoading(false);
    }
  }, [recordType, showNotification]);

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
      // Handle both new format (direct array) and old format (results property)
      return Array.isArray(data) ? data : (data.results || []);
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
      PurchaseOrder: {
        endpoint: `${apiConfig.baseURL}/purchase-order-line/by-purchase-order/${transactionId}`,
        idField: 'poid'
      },
      ItemReceipt: {
        endpoint: `${apiConfig.baseURL}/item-receipt-line/by-item-receipt/${transactionId}`,
        idField: 'irid'
      },
      VendorBill: {
        endpoint: `${apiConfig.baseURL}/vendor-bill-line/by-vendor-bill/${transactionId}`,
        idField: 'vbid'
      },
      VendorCredit: {
        endpoint: `${apiConfig.baseURL}/vendor-credit-line/by-vendor-credit/${transactionId}`,
        idField: 'vcid'
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
      // Handle both new format (direct array) and old format (results property)
      const items = Array.isArray(data) ? data : (data.results || []);

      // Transform API data to match form structure
      return items.map((item, index) => ({
        itemID: item.itemID || '',
        quantity: item.quantity,
        receivedQty: item.receivedQty || 0,
        rate: item.rate || 0,
        taxID: item.taxID || '',
        taxPercent: item.taxPercent || 0,
        taxAmount: item.taxAmount || 0,
        totalAmount: item.totalAmount || 0
      }));
    } catch (err) {
      throw err;
    }
  }, [recordType]);

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
        const dropdownPromises = [
          fetchDropdownData('/product/active').then(data => ({ name: 'itemID', data })),
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

        // FOR ITEM RECEIPT: Check sessionStorage for purchase order data
        if (recordType === 'ItemReceipt' && mode === 'new') {
          const purchaseOrderDataString = sessionStorage.getItem('purchaseOrderDataForReceiving');
          if (purchaseOrderDataString) {
            try {
              const purchaseOrderData = JSON.parse(purchaseOrderDataString);
              const itemsArray = purchaseOrderData.items || [];
              if (itemsArray.length > 0) {
                console.log('[PurchaseItems] Loading items from sessionStorage for ItemReceipt:', itemsArray);
                initialFormData.items = itemsArray;
              }
            } catch (error) {
              console.error('Error parsing purchase order data from sessionStorage:', error);
            }
          }
        }

        // FOR VENDOR BILL: Check sessionStorage for item receipt data
        if (recordType === 'VendorBill' && mode === 'new') {
          const itemReceiptDataString = sessionStorage.getItem('itemReceiptDataForBilling');
          if (itemReceiptDataString) {
            try {
              const itemReceiptData = JSON.parse(itemReceiptDataString);
              const itemsArray = itemReceiptData.items || [];
              if (itemsArray.length > 0) {
                console.log('[PurchaseItems] Loading items from sessionStorage for VendorBill:', itemsArray);
                initialFormData.items = itemsArray;
              }
            } catch (error) {
              console.error('Error parsing item receipt data from sessionStorage:', error);
            }
          }
        }

        if (mode !== 'new' && id) {
          // Load existing transaction items
          try {
            const existingItems = await loadTransactionItems(id);
            if (existingItems && existingItems.length > 0) {
              initialFormData.items = existingItems;
            }
          } catch (err) {
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

  // Fetch unreceived items when POID changes for ItemReceipt
  useEffect(() => {
    console.log('[PurchaseItems] useEffect for PO lines - recordType:', recordType, 'poid:', poid, 'mode:', mode);
    if (recordType === 'ItemReceipt' && poid && (mode === 'new' || mode === 'edit')) {
      console.log('[PurchaseItems] Calling fetchUnreceivedPurchaseOrderLines with poid:', poid);
      fetchUnreceivedPurchaseOrderLines(poid);
    }
  }, [poid, recordType, mode, fetchUnreceivedPurchaseOrderLines]);

  // Fetch unbilled items when IRID changes for VendorBill
  useEffect(() => {
    if (recordType === 'VendorBill' && irid && (mode === 'new' || mode === 'edit')) {
      console.log('[PurchaseItems] IRID changed, fetching unbilled items:', irid);
      fetchUnbilledItemReceiptLines(irid);
    }
  }, [irid, recordType, mode, fetchUnbilledItemReceiptLines]);

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
        PurchaseOrder: {
          endpoint: `${apiConfig.baseURL}/purchase-order-line`,
          idField: 'poid',
          quantityField: 'quantity'
        },
        ItemReceipt: {
          endpoint: `${apiConfig.baseURL}/item-receipt-line`,
          idField: 'irid',
          quantityField: 'quantity'
        },
        VendorBill: {
          endpoint: `${apiConfig.baseURL}/vendor-bill-line`,
          idField: 'vbid',
          quantityField: 'quantity'
        }
      };

      const config = transactionConfig[recordType];
      if (!config) {
        throw new Error(`Unsupported record type: ${recordType}`);
      }

      // Create line items one by one (following FormCreator.js pattern)
      const lineCreationPromises = lineItems.map(async (line, index) => {
        const quantity = Number(line.quantity || 0);
        const rate = Number(line.rate || 0);
        const taxPercent = Number(line.taxPercent || 0);

        // Calculate amounts using header discount
        // Gross: round to 10 decimals
        const lineTotal = Math.round(quantity * rate * 10000000000) / 10000000000;
        const discountAmount = headerDiscount || 0;
        // Subtotal: round to 2 decimals
        const subtotal = Math.round((lineTotal - discountAmount) * 100) / 100;
        // Tax: round to 2 decimals
        const taxAmount = Math.round(subtotal * taxPercent / 100 * 100) / 100;
        // Net: round to 2 decimals
        const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

        // Build line payload based on transaction type - matching exact API JSON structure
        const linePayload = {
          [config.idField]: transactionId,
          itemID: line.itemID?.value || line.itemID,
          quantity: quantity,
          rate: rate,
          taxID: line.taxID?.value || line.taxID,
          taxPercent: taxPercent,
          taxAmount: taxAmount,
          totalAmount: totalAmount
        };

        // Add sequence number fields based on transaction type
        if (recordType === 'PurchaseOrder') {
          linePayload.poSequenceNumber = `PO-${String(index + 1).padStart(3, '0')}`;
        } else if (recordType === 'ItemReceipt') {
          linePayload.irSequenceNumber = `IR-${String(index + 1).padStart(3, '0')}`;
        } else if (recordType === 'VendorBill') {
          linePayload.vbSequenceNumber = `VB-${String(index + 1).padStart(3, '0')}`;
        }

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
    const { parentField, editIndex, validatedItems, onUpdateField, poid, selectedLocation, unreceivedLines, isRestrictedToUnreceived, irid, unbilledItems, unbilledLoading } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;
    const shouldValidate = validatedItems.includes(props.dataItem[ITEM_DATA_INDEX]);

    if (isInEdit) {
      let productOptions;
      let selectedValue = null;

      if (recordType === 'ItemReceipt' && (mode === 'new' || mode === 'edit') && poid && unreceivedLines && unreceivedLines.length > 0) {
        const allProducts = getDropdownProps('itemID');
        // Create options from unreceived lines only
        productOptions = unreceivedLines.map(line => {
          const product = allProducts.find(p => p.value === line.itemID);
          // Use line ID as value to support duplicate items
          return {
            text: product?.text ? product.text : `Item ${line.itemID}`,
            value: line.id, // Use purchase order line ID as value for duplicate item support
            itemID: line.itemID, // Store the actual itemID for later use
            item: { ...product?.item, unreceivedLine: line }
          };
        });

        // Find selected value by matching either:
        // 1. The line ID (stored in purchaseOrderLineId) - for items just selected
        // 2. The actual itemID - for items that have been saved
        const currentItemID = props.dataItem[props.field];
        const currentPurchaseOrderLineId = props.dataItem.purchaseOrderLineId;

        selectedValue = productOptions.find(p => {
          // Match by line ID first (most accurate for duplicate items)
          if (currentPurchaseOrderLineId && p.value === currentPurchaseOrderLineId) {
            return true;
          }
          // Fallback: match by actual itemID
          if (currentItemID && p.itemID === currentItemID) {
            return true;
          }
          return false;
        }) || null;

      } else if (recordType === 'VendorBill' && (mode === 'new' || mode === 'edit') && irid && unbilledItems && unbilledItems.length > 0) {
        const allProducts = getDropdownProps('itemID');
        // Create options from unbilled lines only
        productOptions = unbilledItems.map(line => {
          const product = allProducts.find(p => p.value === line.itemID);
          // Use line ID as value to support duplicate items
          return {
            text: product?.text ? product.text : `Item ${line.itemID}`,
            value: line.id, // Use item receipt line ID as value for duplicate item support
            itemID: line.itemID, // Store the actual itemID for later use
            item: { ...product?.item, unbilledLine: line }
          };
        });

        // Find selected value by matching either:
        // 1. The line ID (stored in itemReceiptLineId) - for items just selected
        // 2. The actual itemID - for items that have been saved
        const currentItemID = props.dataItem[props.field];
        const currentItemReceiptLineId = props.dataItem.itemReceiptLineId;

        selectedValue = productOptions.find(p => {
          // Match by line ID first (most accurate for duplicate items)
          if (currentItemReceiptLineId && p.value === currentItemReceiptLineId) {
            return true;
          }
          // Fallback: match by actual itemID
          if (currentItemID && p.itemID === currentItemID) {
            return true;
          }
          return false;
        }) || null;

      } else if (recordType === 'VendorBill' && mode === 'new' && irid && unbilledLoading) {
        // Show loading state
        productOptions = [{ text: 'Loading unbilled items...', value: '', disabled: true }];
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

              // For ItemReceipt and VendorBill, pass the entire selected option with line data
              const selectedLineData = selectedOption?.item?.unreceivedLine || selectedOption?.item?.unbilledLine;

              await onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, selectedValue, selectedLineData);
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
    const { parentField, editIndex, onUpdateField, poid, selectedLocation, unreceivedLines, isRestrictedToUnreceived, irid, unbilledItems, unbilledLoading, rawPurchaseOrderLines, rawItemReceiptLines } = React.useContext(ItemGridEditContext);
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
            onChange={(e) => {
              const originalQuantity = originalQuantityRef.current || 0;
              const inputValue = e.target.value;
              let newValue = inputValue === '' ? '' : parseInt(inputValue) || '';

              // Validation for ItemReceipt edit mode only with proper calculations
              if (recordType === 'ItemReceipt' && (mode === 'edit' || mode === 'new') && newValue !== '' && props.dataItem.itemID && poid) {
                try {
                  // Find the purchase order line by purchaseOrderLineId (NOT by itemID - multiple lines can have same itemID)
                  const purchaseOrderLineId = props.dataItem.purchaseOrderLineId || props.dataItem.poLineId;

                  // In EDIT mode: Use RAW purchase order line data to get the real remaining qty
                  const rawPurchaseOrderLine = purchaseOrderLineId && rawPurchaseOrderLines && rawPurchaseOrderLines.length > 0
                    ? rawPurchaseOrderLines.find(line => line.id === purchaseOrderLineId)
                    : null;

                  console.log("purchaseOrderLineId", purchaseOrderLineId)
                  console.log("rawPurchaseOrderLines", rawPurchaseOrderLines)
                  console.log("unreceivedLines", unreceivedLines)
                  // Fallback to unreceivedLines if raw data not available (for new mode)
                  const purchaseOrderLine = rawPurchaseOrderLine || (purchaseOrderLineId
                    ? unreceivedLines.find(line => line.id === purchaseOrderLineId)
                    : unreceivedLines.find(line => line.itemID === props.dataItem.itemID)); // Fallback for old records

                  console.log("purchaseOrderLine", purchaseOrderLine)
                  if (purchaseOrderLine) {
                    const changedQuantity = parseInt(newValue) || 0; // New quantity user is trying to set

                    // Get the ORIGINAL purchase order quantity (from raw data if available)
                    const originalPOQuantity = rawPurchaseOrderLine ? (rawPurchaseOrderLine.quantity || 0) : (purchaseOrderLine.quantity || 0);

                    // Get the CURRENT received quantity (from raw data if in edit mode)
                    const currentReceivedQty = rawPurchaseOrderLine ? (rawPurchaseOrderLine.receivedQty || 0) : (purchaseOrderLine.receivedQty || 0);

                    // In EDIT mode: current item's original quantity should be excluded from received qty
                    // to calculate what's available for THIS record
                    let availableQuantity;
                    if (mode === 'edit' && originalQuantity > 0) {
                      // Available = Original PO Qty - (Received by others)
                      // Received by others = Total Received - Current record's original qty
                      const receivedByOthers = Math.max(0, currentReceivedQty - originalQuantity);
                      availableQuantity = originalPOQuantity - receivedByOthers;
                      console.log(`[Quantity Validation EDIT] purchaseOrderLineId: ${purchaseOrderLineId}, originalPOQty: ${originalPOQuantity}, totalReceived: ${currentReceivedQty}, currentRecordOriginalQty: ${originalQuantity}, receivedByOthers: ${receivedByOthers}, availableForThisRecord: ${availableQuantity}, changedQuantity: ${changedQuantity}`);
                    } else {
                      // NEW mode: Simple formula: Purchase Order Quantity - Current Received Quantity = Available
                      availableQuantity = originalPOQuantity - currentReceivedQty;
                      console.log(`[Quantity Validation NEW] purchaseOrderLineId: ${purchaseOrderLineId}, originalPOQty: ${originalPOQuantity}, currentReceivedQty: ${currentReceivedQty}, availableQuantity: ${availableQuantity}, changedQuantity: ${changedQuantity}`);
                    }

                    // Check if new quantity exceeds available quantity
                    if (changedQuantity > availableQuantity) {
                      alert(`Quantity ${changedQuantity} exceeds remaining quantity ${availableQuantity} from purchase order line.`);
                      newValue = Math.max(0, availableQuantity); // Set to maximum available quantity
                    }
                  }
                  if (unreceivedLines.length == 0) {
                    if (newValue > originalQuantity) {
                      alert(`Quantity ${newValue} exceeds remaining quantity ${originalQuantity} from purchase order line.`);
                      newValue = originalQuantity;
                    }
                  }
                } catch (error) {
                  console.error('Error validating quantity in edit mode:', error);
                }
              }

              // Validation for VendorBill edit mode only with proper calculations
              if (recordType === 'VendorBill' && (mode === 'edit' || mode === 'new') && newValue !== '' && props.dataItem.itemID && irid) {
                try {
                  // Find the item receipt line by itemReceiptLineId (NOT by itemID - multiple lines can have same itemID)
                  const itemReceiptLineId = props.dataItem.itemReceiptLineId || props.dataItem.irLineId;

                  // In EDIT mode: Use RAW item receipt line data to get the real remaining qty
                  const rawItemReceiptLine = itemReceiptLineId && rawItemReceiptLines && rawItemReceiptLines.length > 0
                    ? rawItemReceiptLines.find(line => line.id === itemReceiptLineId)
                    : null;

                  // Fallback to unbilledItems if raw data not available (for new mode)
                  const itemReceiptLine = rawItemReceiptLine || (itemReceiptLineId
                    ? unbilledItems.find(line => line.id === itemReceiptLineId)
                    : unbilledItems.find(line => line.itemID === props.dataItem.itemID)); // Fallback for old records

                  if (itemReceiptLine) {
                    const changedQuantity = parseInt(newValue) || 0; // New quantity user is trying to set

                    // Get the ORIGINAL item receipt quantity (from raw data if available)
                    const originalIRQuantity = rawItemReceiptLine ? (rawItemReceiptLine.quantity || 0) : (itemReceiptLine.quantity || 0);

                    // Get the CURRENT billed quantity (from raw data if in edit mode)
                    const currentBilledQty = rawItemReceiptLine ? (rawItemReceiptLine.invoicedQty || 0) : (itemReceiptLine.invoicedQty || 0);

                    // In EDIT mode: current item's original quantity should be excluded from billed qty
                    // to calculate what's available for THIS record
                    let availableQuantity;
                    if (mode === 'edit' && originalQuantity > 0) {
                      // Available = Original IR Qty - (Billed by others)
                      // Billed by others = Total Billed - Current record's original qty
                      const billedByOthers = Math.max(0, currentBilledQty - originalQuantity);
                      availableQuantity = originalIRQuantity - billedByOthers;
                      console.log(`[Quantity Validation EDIT VendorBill] itemReceiptLineId: ${itemReceiptLineId}, originalIRQty: ${originalIRQuantity}, totalBilled: ${currentBilledQty}, currentRecordOriginalQty: ${originalQuantity}, billedByOthers: ${billedByOthers}, availableForThisRecord: ${availableQuantity}, changedQuantity: ${changedQuantity}`);
                    } else {
                      // NEW mode: Simple formula: Item Receipt Quantity - Current Billed Quantity = Available
                      availableQuantity = originalIRQuantity - currentBilledQty;
                      console.log(`[Quantity Validation NEW VendorBill] itemReceiptLineId: ${itemReceiptLineId}, originalIRQty: ${originalIRQuantity}, currentBilledQty: ${currentBilledQty}, availableQuantity: ${availableQuantity}, changedQuantity: ${changedQuantity}`);
                    }

                    // Check if new quantity exceeds available quantity
                    if (changedQuantity > availableQuantity) {
                      alert(`Quantity ${changedQuantity} exceeds remaining quantity ${availableQuantity} from item receipt line.`);
                      newValue = Math.max(0, availableQuantity); // Set to maximum available quantity
                    }
                  }

                  if (unbilledItems.length == 0) {
                    if (newValue > originalQuantity) {
                      alert(`Quantity ${newValue} exceeds remaining quantity ${originalQuantity} from purchase order line.`);
                      newValue = originalQuantity;
                    }
                  }
                } catch (error) {
                  console.error('Error validating quantity in edit mode:', error);
                }
              }

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
            disabled={mode === 'view' || recordType === 'VendorCredit' || recordType === 'PurchaseOrder'}
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
    const taxValue = props.dataItem['taxAmount'] || 0;

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

  // Received Qty Cell - only for PurchaseOrder in edit/view mode, always disabled
  const ReceivedQtyCell = (props) => {
    const receivedQty = props.dataItem.receivedQty || 0;

    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        <span style={{ padding: '8px', display: 'block' }}>
          {receivedQty}
        </span>
      </td>
    );
  };

  // Invoiced Qty Cell - only for ItemReceipt in edit/view mode, always disabled
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

  // Remaining Qty Cell - for ItemReceipt and VendorBill in edit/new mode, always disabled
  const RemQtyCell = (props) => {
    const { unreceivedLines, unbilledItems, rawPurchaseOrderLines, rawItemReceiptLines } = React.useContext(ItemGridEditContext);
    // Calculate remaining quantity based on record type
    let remainingQty = 0;

    if (recordType === 'ItemReceipt' && props.dataItem.itemID) {
      // Match by purchaseOrderLineId (parent line ID) to handle duplicate items correctly
      const purchaseOrderLineId = props.dataItem.purchaseOrderLineId || props.dataItem.poLineId;

      if (purchaseOrderLineId && rawPurchaseOrderLines && rawPurchaseOrderLines.length > 0) {
        // FETCH REAL REMAINING QTY FROM RAW PURCHASE ORDER LINE DATA
        const rawPurchaseOrderLine = rawPurchaseOrderLines.find(line => line.id === purchaseOrderLineId);
        if (rawPurchaseOrderLine) {
          remainingQty = Math.max(0, (rawPurchaseOrderLine.quantity || 0) - (rawPurchaseOrderLine.receivedQty || 0));
        }
      } else if (purchaseOrderLineId && unreceivedLines && unreceivedLines.length > 0) {
        // Fallback to merged data if raw data not available
        const purchaseOrderLine = unreceivedLines.find(line => line.id === purchaseOrderLineId);
        if (purchaseOrderLine) {
          remainingQty = Math.max(0, (purchaseOrderLine.quantity || 0) - (purchaseOrderLine.receivedQty || 0));
        }
      } else {
        // In edit mode without parent line ID: show already-set quantity as remaining
        remainingQty = 0;
      }
    }

    if (recordType === 'VendorBill' && props.dataItem.itemID) {
      // Match by itemReceiptLineId (parent line ID) to handle duplicate items correctly
      const itemReceiptLineId = props.dataItem.itemReceiptLineId || props.dataItem.irLineId;

      if (itemReceiptLineId && rawItemReceiptLines && rawItemReceiptLines.length > 0) {
        // FETCH REAL REMAINING QTY FROM RAW ITEM RECEIPT LINE DATA
        const rawItemReceiptLine = rawItemReceiptLines.find(line => line.id === itemReceiptLineId);
        if (rawItemReceiptLine) {
          remainingQty = Math.max(0, (rawItemReceiptLine.quantity || 0) - (rawItemReceiptLine.invoicedQty || 0));
        }
      } else if (itemReceiptLineId && unbilledItems && unbilledItems.length > 0) {
        // Fallback to merged data if raw data not available
        const itemReceiptLine = unbilledItems.find(line => line.id === itemReceiptLineId);
        if (itemReceiptLine) {
          remainingQty = Math.max(0, (itemReceiptLine.quantity || 0) - (itemReceiptLine.invoicedQty || 0));
        }
      } else {
        // In edit mode without parent line ID: show already-set quantity as remaining
        remainingQty = 0;
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
      onRemove(props.dataItem);
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
  const PurchaseItemsGrid = (fieldArrayRenderProps) => {
    const { validationMessage, visited, name, dataItemKey, onTotalAmountChange } = fieldArrayRenderProps;
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

    const onUpdateField = useCallback(async (index, fieldName, value, selectedLineData = null) => {
      const currentItem = fieldArrayRenderProps.value[index];
      const updatedItem = {
        ...currentItem,
        [fieldName]: value
      };

      // When item is selected, automatically fetch purchase price and tax code
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

          const currentItems = fieldArrayRenderProps.value || [];

          // CHECK FOR DUPLICATE purchaseOrderLineId (for ItemReceipt)
          if (recordType === 'ItemReceipt' && selectedLineData) {
            const purchaseOrderLineId = selectedLineData.id || selectedLineData.purchaseOrderLineId;
            const existingLineWithSamePurchaseOrderLineId = currentItems.find((item, idx) =>
              idx !== index && item.purchaseOrderLineId === purchaseOrderLineId
            );

            if (existingLineWithSamePurchaseOrderLineId) {
              alert(`This purchase order line is already added to the item receipt. You cannot add the same purchase order line twice.`);
              updatedItem.itemID = '';
              updatedItem.purchaseOrderLineId = '';
              fieldArrayRenderProps.onReplace({
                index: index,
                value: updatedItem
              });
              return;
            }
          }

          // CHECK FOR DUPLICATE itemReceiptLineId (for VendorBill)
          if (recordType === 'VendorBill' && selectedLineData) {
            const itemReceiptLineId = selectedLineData.id || selectedLineData.itemReceiptLineId;
            const existingLineWithSameItemReceiptLineId = currentItems.find((item, idx) =>
              idx !== index && item.itemReceiptLineId === itemReceiptLineId
            );

            if (existingLineWithSameItemReceiptLineId) {
              alert(`This item receipt line is already added to the vendor bill. You cannot add the same item receipt line twice.`);
              updatedItem.itemID = '';
              updatedItem.itemReceiptLineId = '';
              fieldArrayRenderProps.onReplace({
                index: index,
                value: updatedItem
              });
              return;
            }
          }

          // For ItemReceipt: Use the passed selectedLineData which contains the exact PO line
          if (recordType === 'ItemReceipt' && (mode === 'new' || mode === 'edit') && poid && selectedLineData) {
            try {
              console.log('[PurchaseItems] Using selected line data:', selectedLineData);
              // Set itemID to the actual product ID (not the line ID)
              updatedItem.itemID = selectedLineData.itemID;
              // Use data from selected PO line
              updatedItem.rate = selectedLineData.rate || 0;
              updatedItem.taxID = selectedLineData.taxID || '';
              updatedItem.taxPercent = selectedLineData.taxPercent || 0;
              updatedItem.taxAmount = selectedLineData.taxAmount || 0;
              // Set quantity to remaining unreceived quantity
              const orderedQty = selectedLineData.quantity || 0;
              const receivedQty = selectedLineData.receivedQty || 0;
              const remainingQty = orderedQty - receivedQty;
              const quantityField = recordType === 'ItemReceipt' ? 'quantityReceived' : 'quantity';
              updatedItem[quantityField] = remainingQty > 0 ? remainingQty : 1;
              // IMPORTANT: Store the parent purchase order line ID for duplicate item support
              updatedItem.purchaseOrderLineId = selectedLineData.id || selectedLineData.purchaseOrderLineId;
              console.log('[PurchaseItems] Set purchaseOrderLineId:', updatedItem.purchaseOrderLineId);
            } catch (error) {
              console.error('[PurchaseItems] Error processing selected line data:', error);
            }
          }
          // Fallback logic for when selectedLineData is not provided
          else if (recordType === 'ItemReceipt' && poid && unreceivedLines && unreceivedLines.length > 0) {
            const unreceivedLine = unreceivedLines.find(line => line.id === value); // Now searches by line ID
            if (unreceivedLine) {
              // Set rate from purchase order
              updatedItem.itemID = unreceivedLine.itemID;
              updatedItem.rate = unreceivedLine.rate || 0;

              // Set tax information from purchase order
              updatedItem.taxID = unreceivedLine.taxID || '';
              updatedItem.taxPercent = unreceivedLine.taxPercent || 0;

              // Set default quantity to remaining quantity
              const orderedQty = unreceivedLine.quantity || 0;
              const receivedQty = unreceivedLine.receivedQty || 0;
              const remainingQty = orderedQty - receivedQty;

              const quantityField = recordType === 'ItemReceipt' ? 'quantityReceived' : 'quantity';
              updatedItem[quantityField] = remainingQty > 0 ? remainingQty : 1;

              // IMPORTANT: Store the parent purchase order line ID for duplicate item support
              updatedItem.purchaseOrderLineId = unreceivedLine.id || unreceivedLine.purchaseOrderLineId;
              console.log('[PurchaseItems] Set purchaseOrderLineId:', updatedItem.purchaseOrderLineId);
            }
          } else if (recordType === 'VendorBill' && (mode === 'new' || mode === 'edit') && irid && selectedLineData) {
            try {
              console.log('[PurchaseItems] Using selected line data for VendorBill:', selectedLineData);
              // Set itemID to the actual product ID (not the line ID)
              updatedItem.itemID = selectedLineData.itemID;
              // Use data from selected ItemReceipt line
              updatedItem.rate = selectedLineData.rate || 0;
              updatedItem.taxID = selectedLineData.taxID || '';
              updatedItem.taxPercent = selectedLineData.taxPercent || 0;
              updatedItem.taxAmount = selectedLineData.taxAmount || 0;
              // Set quantity to remaining unbilled quantity
              const receivedQty = selectedLineData.quantity || 0;
              const billedQty = selectedLineData.invoicedQty || 0;
              const remainingQty = receivedQty - billedQty;
              updatedItem.quantity = remainingQty > 0 ? remainingQty : 1;
              // IMPORTANT: Store the parent item receipt line ID for duplicate item support
              updatedItem.itemReceiptLineId = selectedLineData.id || selectedLineData.itemReceiptLineId;
              console.log('[PurchaseItems] Set itemReceiptLineId:', updatedItem.itemReceiptLineId);
            } catch (error) {
              console.error('[PurchaseItems] Error processing selected line data for VendorBill:', error);
            }
          }
          // Fallback logic for VendorBill when selectedLineData is not provided
          else if (recordType === 'VendorBill' && irid && unbilledItems && unbilledItems.length > 0) {
            const unbilledLine = unbilledItems.find(line => line.id === value); // Now searches by line ID
            if (unbilledLine) {
              // Set rate from item receipt
              updatedItem.itemID = unbilledLine.itemID;
              updatedItem.rate = unbilledLine.rate || 0;

              // Set tax information from item receipt
              updatedItem.taxID = unbilledLine.taxID || '';
              updatedItem.taxPercent = unbilledLine.taxPercent || 0;

              // Set default quantity to remaining unbilled quantity
              const receivedQty = unbilledLine.quantity || 0;
              const billedQty = unbilledLine.invoicedQty || 0;
              const remainingQty = receivedQty - billedQty;

              updatedItem.quantity = remainingQty > 0 ? remainingQty : 1;

              // IMPORTANT: Store the parent item receipt line ID for duplicate item support
              updatedItem.itemReceiptLineId = unbilledLine.id || unbilledLine.itemReceiptLineId;
              console.log('[PurchaseItems] Set itemReceiptLineId:', updatedItem.itemReceiptLineId);
            }
          } else {
            // Standard behavior for other transaction types
            const { purchasePrice, taxCode } = await getProductPurchasePriceTaxCode(value);

            // Set the purchase price in the rate field
            updatedItem.rate = purchasePrice || 0;

            // Set the tax code in the taxID field
            updatedItem.taxID = taxCode || '';
          }
        } catch (error) {
          // Continue with the item selection even if price/tax fetch fails
        }
      }

      // When tax is changed, update taxPercent
      if (fieldName === 'taxID' && value) {
        const taxOptions = getDropdownProps('taxID');
        const selectedTax = taxOptions.find(tax => tax.value === value);
        if (selectedTax && selectedTax.item) {
          let taxRate = 0;

          // Extract tax rate from tax name if format is like "Tax-30"
          if (selectedTax.item.taxName && typeof selectedTax.item.taxName === 'string') {
            const rateMatch = selectedTax.item.taxName.match(/-(\d+(?:\.\d+)?)/);
            if (rateMatch) {
              taxRate = parseFloat(rateMatch[1]);
            }
          }

          // If no rate found from name, use the taxRate field
          if (taxRate === 0 && selectedTax.item.taxRate) {
            taxRate = parseFloat(selectedTax.item.taxRate);
          }

          updatedItem.taxPercent = taxRate;
        }
      }

      fieldArrayRenderProps.onReplace({
        index: index,
        value: updatedItem
      });
    }, [fieldArrayRenderProps, recordType, selectedLocation, getProductPurchasePriceTaxCode, getDropdownProps]);


    // Function to calculate totals
    const calculateTotals = (items) => {
      if (!items || items.length === 0) {
        return { totalAmount: 0, totalQuantity: 0 };
      }
      const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      const totalQuantity = items.reduce((sum, item) => sum + (item['quantity'] || 0), 0);
      return { totalAmount, totalQuantity };
    };

    // State-based totals that only update on button actions (Add, Edit, Discard, Delete)
    const [totals, setTotals] = useState(() => calculateTotals(fieldArrayRenderProps.value));


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


    // Add a new item
    const onAdd = useCallback((e) => {

      if (!selectedLocation) {
        alert('Please select a location first! and Mandatory fields are required');
        return;
      }
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

      // Generate temporary unique ID for client-side tracking (not stored in DB)
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create new item with correct quantity field based on record type
      const newItem = {
        tempId: tempId,  // Client-side unique ID for new items (allows duplicate products)
        // id field will be populated from database after save
        itemID: '',
        rate: 0,
        taxID: '',
        taxPercent: 0,
        totalAmount: 0
      };

      // Set the appropriate quantity field
      if (recordType === 'ItemReceipt') {
        newItem.quantityReceived = 1;
      } else if (recordType === 'Invoice') {
        newItem.quantityDelivered = 1;
      } else {
        newItem.quantity = 1;
      }

      console.log('[DEBUG] Adding new purchase item with tempId:', newItem);

      fieldArrayRenderProps.onUnshift({ value: newItem });
      setEditIndex(0);
      // Update totals after adding item
      setTimeout(() => updateTotals(), 0);
    }, [fieldArrayRenderProps, editIndex, recordType, mode, updateTotals]);

    const onRemove = useCallback(async (dataItem) => {
      const index = dataItem[ITEM_DATA_INDEX];

      // // For ItemReceipt delete operation, reverse the receivedQty on purchaseorderline
      // if (recordType === 'ItemReceipt' && dataItem.itemID && poid) {
      //   try {
      //     // Use purchaseOrderLineId for exact match (handles duplicate items correctly)
      //     let purchaseOrderLineId = dataItem.purchaseOrderLineId || dataItem.poLineId;

      //     // If we don't have purchaseOrderLineId and this is an existing item from DB, try to fetch it
      //     if (!purchaseOrderLineId && dataItem.id) {
      //       try {
      //         const irLineResponse = await fetch(buildUrl(`/item-receipt-line/${dataItem.id}`), {
      //           headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      //         });
      //         if (irLineResponse.ok) {
      //           const irLineData = await irLineResponse.json();
      //           purchaseOrderLineId = irLineData.purchaseOrderLineId || irLineData.poLineId || irLineData.poid;
      //         }
      //       } catch (err) {
      //         console.warn('Could not fetch purchaseOrderLineId from ItemReceiptLine:', err);
      //       }
      //     }

      //     if (purchaseOrderLineId) {
      //       // Direct update using the parent line ID
      //       const response = await fetch(buildUrl(`/purchase-order-line/${purchaseOrderLineId}`), {
      //         headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      //       });

      //       if (response.ok) {
      //         const purchaseOrderLine = await response.json();
      //         const quantityToReverse = dataItem.quantity || dataItem.quantityReceived || 0;
      //         const currentReceivedQty = purchaseOrderLine.receivedQty || 0;
      //         const newReceivedQty = Math.max(0, currentReceivedQty - quantityToReverse);

      //         // Update the purchase order line
      //         const updateResponse = await fetch(buildUrl(`/purchase-order-line/${purchaseOrderLine.id}`), {
      //           method: 'PUT',
      //           headers: { 'Content-Type': 'application/json' },
      //           body: JSON.stringify({
      //             ...purchaseOrderLine,
      //             receivedQty: newReceivedQty
      //           })
      //         });

      //         if (!updateResponse.ok) {
      //           console.error('Failed to update purchase order line quantity');
      //         }
      //       }
      //     } else {
      //       console.warn('Cannot update parent PurchaseOrderLine: purchaseOrderLineId not found. This may cause issues with duplicate items.');
      //     }
      //   } catch (error) {
      //     console.error('Error reversing purchase order line quantity:', error);
      //   }
      // }

      // // For VendorBill delete operation, reverse the invoicedQty on itemreceiptline
      // if (recordType === 'VendorBill' && dataItem.itemID && irid) {
      //   try {
      //     // Use itemReceiptLineId for exact match (handles duplicate items correctly)
      //     let itemReceiptLineId = dataItem.itemReceiptLineId || dataItem.irLineId;

      //     // If we don't have itemReceiptLineId and this is an existing item from DB, try to fetch it
      //     if (!itemReceiptLineId && dataItem.id) {
      //       try {
      //         const vbLineResponse = await fetch(buildUrl(`/vendor-bill-line/${dataItem.id}`), {
      //           headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      //         });
      //         if (vbLineResponse.ok) {
      //           const vbLineData = await vbLineResponse.json();
      //           itemReceiptLineId = vbLineData.itemReceiptLineId || vbLineData.irLineId || vbLineData.irid;
      //         }
      //       } catch (err) {
      //         console.warn('Could not fetch itemReceiptLineId from VendorBillLine:', err);
      //       }
      //     }

      //     if (itemReceiptLineId) {
      //       // Direct update using the parent line ID
      //       const response = await fetch(buildUrl(`/item-receipt-line/${itemReceiptLineId}`), {
      //         headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      //       });

      //       if (response.ok) {
      //         const itemReceiptLine = await response.json();
      //         const quantityToReverse = dataItem.quantity || dataItem.quantityInvoiced || dataItem.quantityReceived || 0;
      //         const currentInvoicedQty = itemReceiptLine.invoicedQty || 0;
      //         const newInvoicedQty = Math.max(0, currentInvoicedQty - quantityToReverse);

      //         // Update the item receipt line
      //         const updateResponse = await fetch(buildUrl(`/item-receipt-line/${itemReceiptLine.id}`), {
      //           method: 'PUT',
      //           headers: { 'Content-Type': 'application/json' },
      //           body: JSON.stringify({
      //             ...itemReceiptLine,
      //             invoicedQty: newInvoicedQty
      //           })
      //         });

      //         if (!updateResponse.ok) {
      //           console.error('Failed to update item receipt line quantity');
      //         }
      //       }
      //     } else {
      //       console.warn('Cannot update parent ItemReceiptLine: itemReceiptLineId not found. This may cause issues with duplicate items.');
      //     }
      //   } catch (error) {
      //     console.error('Error reversing item receipt line quantity:', error);
      //   }
      // }

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
    }, [fieldArrayRenderProps, recordType, poid, irid, calculateTotals, onTotalAmountChange]);

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
      // Don't update totals when canceling - we're just reverting to original values
      // The totals should remain the same as before the edit started
    }, [fieldArrayRenderProps]);

    const onSave = useCallback((dataItem) => {
      const index = dataItem[ITEM_DATA_INDEX];
      const currentItem = fieldArrayRenderProps.value[index];

      // Basic validation
      if (!currentItem.itemID) {
        alert('Product is required');
        return;
      }

      const quantityField = recordType === 'ItemReceipt' ? 'quantityReceived' : (recordType === 'Invoice' ? 'quantityDelivered' : 'quantity');
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
        const selectedTax = taxOptions.find(tax => tax.value === taxID);
        if (selectedTax && selectedTax.item) {
          let taxRate = 0;

          // Extract tax rate from tax name if format is like "Tax-30" - matching SalesOrderForm.js
          if (selectedTax.item.taxName && typeof selectedTax.item.taxName === 'string') {
            const rateMatch = selectedTax.item.taxName.match(/-(\d+(?:\.\d+)?)/);
            if (rateMatch) {
              taxRate = parseFloat(rateMatch[1]);
            }
          }

          // If no rate found from name, use the taxRate field - matching SalesOrderForm.js
          if (taxRate === 0 && selectedTax.item.taxRate) {
            taxRate = parseFloat(selectedTax.item.taxRate);
          }

          taxPercent = taxRate;
        }
      }

      // Calculate using header discount
      // Gross: round to 10 decimals
      const lineTotal = Math.round(quantity * rate * 10000000000) / 10000000000;
      const discountAmount = headerDiscount || 0;
      // Subtotal: round to 2 decimals
      const subtotal = Math.round((lineTotal - discountAmount) * 100) / 100;
      const taxFieldName = recordType === 'Invoice' ? 'taxRate' : 'taxAmount';
      // Tax: round to 2 decimals
      const taxAmount = Math.round(subtotal * taxPercent / 100 * 100) / 100;
      // Net: round to 2 decimals
      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

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

      setEditIndex(undefined);
      editItemCloneRef.current = undefined;
      // Update totals after saving item
      setTimeout(() => updateTotals(), 0);
    }, [fieldArrayRenderProps, recordType, getDropdownProps, updateTotals]);

    // Calculate amounts when values change - matching SalesOrderForm.js logic
    React.useEffect(() => {
      if (editIndex !== undefined && fieldArrayRenderProps.value[editIndex]) {
        const currentItem = fieldArrayRenderProps.value[editIndex];
        const quantityField = recordType === 'ItemReceipt' ? 'quantityReceived' : (recordType === 'Invoice' ? 'quantityDelivered' : 'quantity');
        const quantity = currentItem[quantityField] === '' ? 0 : parseFloat(currentItem[quantityField]) || 0;
        const rate = currentItem.rate === '' ? 0 : parseFloat(currentItem.rate) || 0;

        // Calculate using header discount
        // Gross: round to 10 decimals
        const lineTotal = Math.round(quantity * rate * 10000000000) / 10000000000;
        const discountAmount = headerDiscount || 0;
        // Subtotal: round to 2 decimals
        const subtotal = Math.round((lineTotal - discountAmount) * 100) / 100;
        const taxPercent = parseFloat(currentItem.taxPercent) || 0;
        // Tax: round to 2 decimals
        const taxAmount = Math.round(subtotal * taxPercent / 100 * 100) / 100;
        // Net: round to 2 decimals
        const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

        // Only update if calculations actually changed
        const roundedTaxAmount = Math.round(taxAmount * 100) / 100;
        const roundedTotalAmount = Math.round(totalAmount * 100) / 100;
        const taxFieldName = recordType === 'Invoice' ? 'taxRate' : 'taxAmount';
        const currentTaxAmount = Math.round((parseFloat(currentItem[taxFieldName]) || 0) * 100) / 100;
        const currentTotalAmount = Math.round((parseFloat(currentItem.totalAmount) || 0) * 100) / 100;

        if (roundedTotalAmount !== currentTotalAmount || roundedTaxAmount !== currentTaxAmount) {
          fieldArrayRenderProps.onReplace({
            index: editIndex,
            value: {
              ...currentItem,
              [taxFieldName]: roundedTaxAmount,
              totalAmount: roundedTotalAmount
            }
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
        poid,
        selectedLocation,
        unreceivedLines,
        isRestrictedToUnreceived,
        irid,
        unbilledItems,
        unbilledLoading,
        rawPurchaseOrderLines,
        rawItemReceiptLines
      }}>


        {visited && validationMessage && (
          <div className="k-form-error" style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
            {validationMessage}
          </div>
        )}

        {mode !== 'view' && (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '8px', paddingRight: '8px' }}>
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
            style={{ minWidth: '900px' }}
          >
            <GridColumn field="itemID" title="Item" cells={{ data: ItemCell }} />
            <GridColumn
              field={recordType === 'ItemReceipt' ? "quantityReceived" : (recordType === 'Invoice' ? "quantityDelivered" : "quantity")}
              title={recordType === 'ItemReceipt' ? "Qty Received" : "Qty"}
              width="90px"
              cells={{ data: QuantityCell }}
            />
            {/* Add Received Qty column for PurchaseOrder in edit/view mode */}
            {recordType === 'PurchaseOrder' && (mode === 'edit' || mode === 'view') && (
              <GridColumn
                field="receivedQty"
                title="Rec Qty"
                width="90px"
                cells={{ data: ReceivedQtyCell }}
              />
            )}
            {/* Add Invoiced Qty column for ItemReceipt in edit/view mode */}
            {recordType === 'ItemReceipt' && (mode === 'edit' || mode === 'view') && (
              <GridColumn
                field="invoicedQty"
                title="Inv Qty"
                width="90px"
                cells={{ data: InvoicedQtyCell }}
                media="(min-width: 992px)"
              />
            )}
            {/* Add REM Qty column for ItemReceipt and VendorBill in edit/new mode */}
            {(recordType === 'ItemReceipt' || recordType === 'VendorBill') && (mode === 'edit' || mode === 'new') && (
              <GridColumn
                field="remQty"
                title="REM Qty"
                width="90px"
                cells={{ data: RemQtyCell }}
                media="(min-width: 768px)"
              />
            )}
            <GridColumn field="rate" title="Rate" width="140px" cells={{ data: RateCell }} />
            <GridColumn field="taxID" title="Tax" width="100px" cells={{ data: TaxCell }} />
            <GridColumn field="taxPercent" title="Tax %" width="70px" cells={{ data: TaxPercentCell }} />
            {recordType === 'Invoice' ? (
              <GridColumn field="taxRate" title="Tax Amt" width="90px" cells={{ data: TaxAmountCell }} />
            ) : (
              <GridColumn field="taxAmount" title="Tax Amt" width="90px" cells={{ data: TaxAmountCell }} />
            )}
            <GridColumn field="totalAmount" title="Amount" width="90px" cells={{ data: TotalAmountCell }} />
            {mode !== 'view' && <GridColumn width="160px" cells={{ data: CommandCell }} />}
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
        const quantityField = recordType === 'ItemReceipt' ? 'quantityReceived' : (recordType === 'Invoice' ? 'quantityDelivered' : 'quantity');
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

  // Vendor Credit Apply Tab Content
  const renderApplyTab = () => {
    if (recordType !== 'VendorCredit') return null;

    const headerBillChecked = vendorBills.length > 0 && vendorBills.every((r) => r.checked);

    return (
      <div className="payment-container">
        <style>{`
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; color: #333; padding: 20px; }
          .payment-container { max-width: 1200px; margin: 0 auto; background-color: #fff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
          .header-bar { background-color: #f7f9fa; padding: 15px 20px; border-bottom: 1px solid #ddd; display: flex; align-items: center; gap: 20px; }
          .header-bar label { font-weight: 600; margin-right: 5px; font-size: 14px; }
          .header-bar .k-numerictextbox { width: 140px; }
          .header-bar .k-numerictextbox .k-input { font-size: 14px; }
          .main-controls-area { padding: 20px 20px 0 20px; }
          .controls-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
          .k-button { margin-right: 5px; }
          .subtab-nav { border-bottom: 2px solid #dee2e6; display: flex; }
          .subtab-link { background: none; border: none; padding: 10px 15px; cursor: pointer; font-size: 14px; font-weight: 600; color: #007bff; margin-bottom: -2px; }
          .subtab-link.active { border-bottom: 2px solid #007bff; }
          .subtab-header { background-color: #f7f9fa; padding: 10px 20px; border-bottom: 1px solid #ddd; display: flex; gap: 30px; font-size: 14px; font-weight: bold; }
          .subtab-header strong { color: #000; }
          .subtab-content { display: block; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #e0e0e0; }
          thead { background-color: #f7f9fa; }
          th { font-weight: 600; color: #555; }
          tr:hover { background-color: #f5f5f5; }
          .text-right { text-align: right; }
          .k-checkbox { width: 16px; height: 16px; cursor: pointer; }
          .payment-input .k-numerictextbox { width: 90%; }
          .payment-input .k-numerictextbox .k-input { text-align: right; }
        `}</style>

        <div className="header-bar">
          <div>
            <label htmlFor="creditAmountLimit">CREDIT AMOUNT *</label>
            <NumericTextBox
              id="creditAmountLimit"
              placeholder="0.00"
              min={0}
              step={0}
              format="n2"
              decimals={2}
              spinners={false}
              value={parseAmount(creditAmountStr)}
              disabled={true}
            />
          </div>
        </div>

        <div className="main-controls-area">
          <div className="controls-top-row">
            <div>
              <Button
                type="button"
                disabled={mode === 'view'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClearAll();
                }}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="subtab-nav">
            <button
              type="button"
              className="subtab-link active"
            >
              Vendor Bills
            </button>
          </div>
        </div>

        <div className="subtab-header">
          <span>
            Applied : <strong>{appliedTo.toFixed(2)}</strong>
          </span>
          <span>&bull;</span>
          <span>
            Unapplied Amount : <strong>{unapplied.toFixed(2)}</strong>
          </span>
        </div>

        <div className="subtab-content">
          {creditLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>Loading vendor bills...</p>
            </div>
          ) : vendorBills.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>No vendor bills found for this vendor.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>
                    <Checkbox
                      checked={headerBillChecked}
                      disabled={mode === 'view'}
                      onChange={(e) => {
                        onHeaderBillToggle();
                      }}
                    />
                  </th>
                  <th>DATE</th>
                  <th>TYPE</th>
                  <th>REF NO.</th>
                  <th className="text-right">AMT. DUE</th>
                  <th className="text-right">CREDIT</th>
                </tr>
              </thead>
              <tbody>
                {vendorBills.map((row) => {
                  const displayValue = row.displayAmount === 0 ? '' : row.displayAmount.toFixed(2);
                  return (
                    <tr key={row.id}>
                      <td>
                        <Checkbox
                          checked={row.checked}
                          disabled={mode === 'view' || row.disabled}
                          onChange={(e) => {
                            const isChecked = e.value !== undefined ? e.value : (e.target ? e.target.checked : false);
                            onBillCheckChange(row.id, isChecked);
                          }}
                        />
                      </td>
                      <td>{row.date}</td>
                      <td>{row.type}</td>
                      <td>{row.refNo}</td>
                      <td className="text-right">{row.dueAmount.toFixed(2)}</td>
                      <td className="text-right payment-input">
                        <NumericTextBox
                          value={displayValue}
                          disabled={mode === 'view'}
                          onChange={(e) => {
                            onBillApplyChange(row.id, e.target.value);
                          }}
                          onFocus={() => onBillApplyFocus(row.id)}
                          onBlur={() => onBillApplyBlur(row.id)}
                          format="n2"
                          step={0}
                          spinners={false}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

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

        {/* Tab Navigation for Vendor Credit */}
        {recordType === 'VendorCredit' && (
          <>
            <style>{`
              .modern-tab-navigation {
                margin: 20px 0;
                border-bottom: 2px solid #e8eaed;
              }
              .modern-tab-buttons {
                display: flex;
                gap: 0;
                background: #f8f9fa;
                border-radius: 8px 8px 0 0;
                padding: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .modern-tab-button {
                background: transparent;
                border: none;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: 500;
                color: #5f6368;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s ease;
                position: relative;
                min-width: 100px;
              }
              .modern-tab-button:hover {
                background: #e8f0fe;
                color: #1a73e8;
              }
              .modern-tab-button.active {
                background: #1a73e8;
                color: white;
                box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
              }
              .modern-tab-button:focus {
                outline: 2px solid #1a73e8;
                outline-offset: 2px;
              }
            `}</style>
            <div className="modern-tab-navigation">
              <div className="modern-tab-buttons">
                <button
                  type="button"
                  className={`modern-tab-button ${activeTab === 'items' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab('items');
                  }}
                >
                  📋 Items
                </button>
                <button
                  type="button"
                  className={`modern-tab-button ${activeTab === 'apply' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab('apply');
                  }}
                >
                  💳 Apply
                </button>
              </div>
            </div>
          </>
        )}

        {/* Tab Content */}
        {activeTab === 'items' || recordType !== 'VendorCredit' ? (
          <FieldArray
            name="items"
            component={PurchaseItemsGrid}
            dataItemKey={DATA_ITEM_KEY}
            validator={(value) => value && value.length ? '' : 'Please add at least one item'}
            onTotalAmountChange={handleTotalAmountChange}
            headerDiscount={headerDiscount}
            selectedLocation={selectedLocation}
            poid={poid}
            irid={irid}
            onUnreceivedLinesLoaded={onUnreceivedLinesLoaded}
          />
        ) : (
          renderApplyTab()
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

      {/* Tab Navigation for Vendor Credit */}
      {recordType === 'VendorCredit' && (
        <div className="tab-navigation">
          <div className="tab-buttons">
            <button
              type="button"
              className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('items');
              }}
            >
              Items
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'apply' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('apply');
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      <Form
        onSubmit={handleSubmit}
        initialValues={formData}
        render={(formRenderProps) => (
          <FormElement style={{ width: '100%' }}>
            <div className="form-grid">
              <div className="order-items-field">
                {/* Tab Content */}
                {activeTab === 'items' || recordType !== 'VendorCredit' ? (
                  <FieldArray
                    name="items"
                    component={PurchaseItemsGrid}
                    dataItemKey={DATA_ITEM_KEY}
                    validator={(value) => value && value.length ? '' : 'Please add at least one item'}
                    onTotalAmountChange={handleTotalAmountChange}
                    headerDiscount={headerDiscount}
                    selectedLocation={selectedLocation}
                    poid={poid}
                    irid={irid}
                    onUnreceivedLinesLoaded={onUnreceivedLinesLoaded}
                  />
                ) : (
                  renderApplyTab()
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
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }

        .tab-buttons {
          display: flex;
          gap: 0;
        }

        .tab-button {
          padding: 12px 24px;
          border: none;
          background: #f5f5f5;
          cursor: pointer;
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
          margin-right: 2px;
          font-weight: 500;
          color: #666;
          transition: all 0.2s ease;
        }

        .tab-button:hover {
          background: #e9e9e9;
          color: #333;
        }

        .tab-button.active {
          background: white;
          color: #333;
          border-bottom: 2px solid #007acc;
          font-weight: 600;
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

        .k-form-field {
          margin-bottom: 16px;
        }

        .k-form-field > .k-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #4a5568;
          font-size: 14px;
        }

        .k-textbox,
        .k-textarea,
        .k-datepicker,
        .k-dropdownlist {
          width: 100%;
          font-size: 14px;
        }

        .k-input, 
        .k-textarea {
          font-size: 14px;
          padding: 8px 12px;
        }

        .k-input:disabled,
        .k-textbox:disabled {
          background-color: #f5f5f5 !important;
          color: #666 !important;
          cursor: not-allowed !important;
          opacity: 0.7;
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

        .k-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .k-button svg {
          font-size: 13px;
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
          min-width: 900px !important; /* Minimum width for all columns to be readable */
          width: auto !important;
        }

        /* Force horizontal scroll on smaller screens */
        @media (max-width: 1200px) {
          .transaction-items-grid-container {
            overflow-x: scroll !important;
            overflow-y: visible !important;
          }
          
          .transaction-items-grid,
          .transaction-items-grid .k-grid-table {
            min-width: 1000px !important;
          }
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

export const PurchaseOrderItems = (props) => <PurchaseItems {...props} recordType="PurchaseOrder" />;
export const ItemReceiptItems = (props) => <PurchaseItems {...props} recordType="ItemReceipt" />;
export const VendorBillItems = (props) => <PurchaseItems {...props} recordType="VendorBill" />;
export const VendorCreditItems = (props) => <PurchaseItems {...props} recordType="VendorCredit" />;

export default PurchaseItems; 