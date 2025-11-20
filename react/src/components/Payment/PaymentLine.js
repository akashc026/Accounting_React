import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { NumericTextBox } from '@progress/kendo-react-inputs';
import { Checkbox } from '@progress/kendo-react-inputs';
import { Button } from '@progress/kendo-react-buttons';
import { apiConfig, buildUrl } from '../../config/api';

const parseAmount = (v) => {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

// Build initial rows from API data (oldest-first)
const buildInitialInvoices = (invoiceData = [], debitMemoData = []) => {
  console.log('🏗️ buildInitialInvoices called with:', {
    invoiceCount: invoiceData?.length || 0,
    debitMemoCount: debitMemoData?.length || 0,
    invoiceData,
    debitMemoData
  });

  // Process invoices
  const processedInvoices = invoiceData.map((inv) => {
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
      originalAmount: parseAmount(inv.totalAmount), // Store original total amount
      // UI state
      displayAmount: 0, // what shows in the PAYMENT box ('' when 0)
      checked: false,
      userTyped: false,
      lockedSeq: null, // order of first typing
      disabled: false,
    };
  });

  // Process debit memos
  const processedDebitMemos = debitMemoData.map((dm) => {
    // Convert API date format (2025-08-18T00:00:00) to DD/MM/YYYY
    const apiDate = new Date(dm.tranDate);
    const formattedDate = `${apiDate.getDate().toString().padStart(2, '0')}/${(apiDate.getMonth() + 1).toString().padStart(2, '0')}/${apiDate.getFullYear()}`;
    
    return {
      id: dm.id,
      date: formattedDate,
      dateKey: apiDate.getTime(),
      type: "Debit Memo",
      refNo: dm.sequenceNumber,
      dueAmount: parseAmount(dm.amountDue || dm.totalAmount),
      originalAmount: parseAmount(dm.totalAmount), // Store original total amount
      // UI state
      displayAmount: 0, // what shows in the PAYMENT box ('' when 0)
      checked: false,
      userTyped: false,
      lockedSeq: null, // order of first typing
      disabled: false,
    };
  });

  // Combine and sort by date (oldest first)
  const combined = [...processedInvoices, ...processedDebitMemos]
    .sort((a, b) => a.dateKey - b.dateKey);

  console.log('🏗️ buildInitialInvoices result:', {
    totalCount: combined.length,
    combined
  });

  return combined;
};

// Build initial vendor bills from API data (oldest-first)
const buildInitialVendorBills = (vendorBillData = []) => {
  console.log('🏗️ buildInitialVendorBills called with:', {
    vendorBillCount: vendorBillData?.length || 0,
    vendorBillData
  });

  // Process vendor bills
  const processedVendorBills = vendorBillData.map((bill) => {
    // Convert API date format to DD/MM/YYYY
    const apiDate = new Date(bill.invoiceDate || bill.billDate || bill.tranDate);
    const formattedDate = `${apiDate.getDate().toString().padStart(2, '0')}/${(apiDate.getMonth() + 1).toString().padStart(2, '0')}/${apiDate.getFullYear()}`;
    
    return {
      id: bill.id,
      date: formattedDate,
      dateKey: apiDate.getTime(),
      type: "Vendor Bill",
      refNo: bill.sequenceNumber,
      dueAmount: parseAmount(bill.amountDue || bill.totalAmount),
      originalAmount: parseAmount(bill.totalAmount), // Store original total amount
      // UI state
      displayAmount: 0, // what shows in the PAYMENT box ('' when 0)
      checked: false,
      userTyped: false,
      lockedSeq: null, // order of first typing
      disabled: false,
    };
  });

  // Sort by date (oldest first)
  const sorted = processedVendorBills.sort((a, b) => a.dateKey - b.dateKey);

  console.log('🏗️ buildInitialVendorBills result:', {
    totalCount: sorted.length,
    sorted
  });

  return sorted;
};


export default function PaymentLine({ customerId, vendorId, locationId, recordType, onPaymentDataChange, isViewMode = false, paymentId = null, mode = 'new' }) {
  /* ===== UI State ===== */
  const [tab, setTab] = useState("invoices");
  const [paymentAmountStr, setPaymentAmountStr] = useState(""); // controlled input
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewModeData, setViewModeData] = useState(null);

  // totals
  const [appliedTo, setAppliedTo] = useState(0);
  const [unapplied, setUnapplied] = useState(0);

  // lock sequence for typed rows
  const lockSeqRef = useRef(1);

  // Snapshot while editing an invoice input (per invoice id)
  const editCtxRef = useRef(new Map()); // id -> { startCents, unappliedAtFocusCents }

  // Send payment data to parent component whenever state changes
  useEffect(() => {
    if (onPaymentDataChange) {
      const paymentData = {
        paymentAmount: paymentAmountStr,
        invoices: invoices,
        appliedTo: appliedTo,
        unapplied: unapplied,
        originalData: viewModeData // Pass original data for edit mode calculations
      };
      onPaymentDataChange(paymentData);
    }
  }, [paymentAmountStr, invoices, appliedTo, unapplied, viewModeData, onPaymentDataChange]);

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
      console.log('📡 fetchInvoices API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📥 fetchInvoices response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ fetchInvoices data received:', data);
      console.log('📊 fetchInvoices count:', Array.isArray(data) ? data.length : 'Not an array');

      return data;
    } catch (err) {
      console.error('❌ fetchInvoices error:', err);
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
      console.log('📡 fetchDebitMemos API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📥 fetchDebitMemos response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ fetchDebitMemos data received:', data);
      console.log('📊 fetchDebitMemos count:', Array.isArray(data) ? data.length : 'Not an array');

      return data;
    } catch (err) {
      console.error('❌ fetchDebitMemos error:', err);
      throw err;
    }
  }, []);

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
      console.log('📡 fetchVendorBills API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📥 fetchVendorBills response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ fetchVendorBills data received:', data);
      console.log('📊 fetchVendorBills count:', Array.isArray(data) ? data.length : 'Not an array');

      return data;
    } catch (err) {
      console.error('❌ fetchVendorBills error:', err);
      throw err;
    }
  }, []);


  // Fetch payment lines for view mode (supports both customer and vendor payments)
  const fetchPaymentLines = useCallback(async (paymentIdParam) => {
    if (!paymentIdParam) return null;
    
    try {
      let url;
      if (recordType === 'CustomerPayment') {
        url = buildUrl(`/customer-payment-line/by-customer-payment/${paymentIdParam}`);
      } else if (recordType === 'VendorPayment') {
        url = buildUrl(`/vendor-payment-line/by-vendor-payment/${paymentIdParam}`);
      } else {
        throw new Error(`Unsupported record type: ${recordType}`);
      }

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
  }, [recordType]);

  // Fetch full record details using specific APIs based on RecordType
  const fetchFullRecordDetails = useCallback(async (recordId, recordType) => {
    try {
      let url;
      switch (recordType) {
        case 'Invoice':
          url = buildUrl(`/invoice/${recordId}`);
          break;
        case 'Debit Memo':
          url = buildUrl(`/debit-memo/${recordId}`);
          break;
        case 'Vendor Bill':
          url = buildUrl(`/vendor-bill/${recordId}`);
          break;
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }

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
      return null;
    }
  }, []);

  // Edit mode logic - fetch payment lines and build record map
  const fetchEditModeData = useCallback(async (paymentIdParam, customerIdParam, vendorIdParam) => {
    const entityId = customerIdParam || vendorIdParam;
    // Require payment ID, entity ID, and location ID for edit mode
    if (!paymentIdParam || !entityId || !locationId) return { recordMap: new Map(), invoices: [] };
    
    try {
      // Step 1: Fetch PaymentLine records
      const paymentLinesData = await fetchPaymentLines(paymentIdParam);
      if (!paymentLinesData || !paymentLinesData.lines) {
        return { recordMap: new Map(), invoices: [] };
      }

      // Step 2: Create map and fetch full records using RecordId and RecordType
      const recordMap = new Map();
      
      // Fetch full details for each payment line record
      const fetchPromises = paymentLinesData.lines.map(async (line) => {
        const fullRecord = await fetchFullRecordDetails(line.recordID, line.recordType);
        if (fullRecord) {
          recordMap.set(line.recordID, {
            ...fullRecord,
            paymentLineData: line // Include payment line data for reference
          });
        }
        return { recordId: line.recordID, recordType: line.recordType, fullRecord };
      });

      await Promise.all(fetchPromises);

      // Step 3: Fetch all records for the customer/vendor
      let processedInvoices;
      if (recordType === 'CustomerPayment') {
        const [invoiceData, debitMemoData] = await Promise.all([
          fetchInvoices(customerIdParam, locationId),
          fetchDebitMemos(customerIdParam, locationId)
        ]);

        // Step 4: Merge fetched records into the map
        [...invoiceData, ...debitMemoData].forEach(record => {
          if (!recordMap.has(record.id)) {
            recordMap.set(record.id, record);
          }
        });

        // Step 5: Build UI data structures
        processedInvoices = buildInitialInvoices(invoiceData, debitMemoData);
      } else if (recordType === 'VendorPayment') {
        const vendorBillData = await fetchVendorBills(vendorIdParam, locationId);

        // Step 4: Merge fetched records into the map
        vendorBillData.forEach(record => {
          if (!recordMap.has(record.id)) {
            recordMap.set(record.id, record);
          }
        });

        // Step 5: Build UI data structures
        processedInvoices = buildInitialVendorBills(vendorBillData);
      }

      console.log('Edit mode record map created:', recordMap);

      // Step 6: Apply payment line data to the processed records
      const validTypes = recordType === 'CustomerPayment'
        ? ['Invoice', 'Debit Memo']
        : ['Vendor Bill'];

      const existingRecordIds = new Set(processedInvoices.map(inv => inv.id));

      paymentLinesData.lines.forEach(line => {
        if (!validTypes.includes(line.recordType)) {
          return;
        }

        const paymentAmount = line.paymentAmount || 0;
        const recordFromMap = recordMap.get(line.recordID) || {};

        const updateInvoiceValues = (invoice) => {
          invoice.displayAmount = paymentAmount;
          invoice.originalDisplayAmount = paymentAmount;
          invoice.checked = line.isApplied !== undefined ? line.isApplied : true;
          invoice.userTyped = true;
          if (recordFromMap && (recordFromMap.totalAmount || recordFromMap.amount || recordFromMap.amountDue)) {
            invoice.originalAmount = parseAmount(
              recordFromMap.totalAmount ?? recordFromMap.amount ?? recordFromMap.amountDue
            );
          }
        };

        const existingInvoice = processedInvoices.find(inv => inv.id === line.recordID);
        if (existingInvoice) {
          updateInvoiceValues(existingInvoice);
          return;
        }

        // Build a synthetic record for closed transactions that no longer appear in API filters
        const dateSource = recordFromMap.invoiceDate ||
          recordFromMap.billDate ||
          recordFromMap.tranDate ||
          recordFromMap.paymentDate ||
          new Date().toISOString();

        const dateObj = new Date(dateSource);
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1)
          .toString()
          .padStart(2, '0')}/${dateObj.getFullYear()}`;

        const fallbackAmount = parseAmount(
          recordFromMap.amountDue ??
          recordFromMap.totalAmount ??
          recordFromMap.amount ??
          paymentAmount
        );

        const syntheticRecord = {
          id: line.recordID,
          date: formattedDate,
          dateKey: dateObj.getTime(),
          type: line.recordType,
          refNo: recordFromMap.sequenceNumber || recordFromMap.referenceNumber || line.refNo || '',
          dueAmount: fallbackAmount,
          originalAmount: fallbackAmount,
          displayAmount: paymentAmount,
          originalDisplayAmount: paymentAmount,
          checked: line.isApplied !== undefined ? line.isApplied : true,
          userTyped: true,
          lockedSeq: null,
          disabled: false
        };

        processedInvoices.push(syntheticRecord);
        existingRecordIds.add(line.recordID);
      });

      processedInvoices.sort((a, b) => a.dateKey - b.dateKey);

      return { recordMap, invoices: processedInvoices, paymentData: paymentLinesData };
    } catch (err) {
      return { recordMap: new Map(), invoices: [] };
    }
  }, [fetchPaymentLines, fetchFullRecordDetails, fetchInvoices, fetchDebitMemos, fetchVendorBills, recordType, locationId]);

  // Transform API payment lines data to component format
  const transformPaymentLinesData = useCallback((apiData) => {
    if (!apiData || !apiData.lines) return { invoices: [] };
    
    const invoiceLines = [];
    
    apiData.lines.forEach(line => {
      const commonData = {
        id: line.recordID,
        date: new Date(line.transactionDate || new Date()).toLocaleDateString('en-GB'),
        dateKey: new Date(line.transactionDate || new Date()).getTime(),
        refNo: line.refNo || line.referenceNumber,
        displayAmount: line.paymentAmount || line.amountApplied || 0,
        originalDisplayAmount: line.paymentAmount || line.amountApplied || 0, // Store original payment amount for edit mode limits
        originalAmount: line.totalAmount || 0, // Store original total amount from API
        checked: line.isApplied !== undefined ? line.isApplied : true,
        userTyped: false,
        lockedSeq: null,
        disabled: isViewMode
      };
      
      const validTypes = recordType === 'CustomerPayment' 
        ? ['Invoice', 'Debit Memo'] 
        : ['Vendor Bill'];
        
      if (validTypes.includes(line.recordType)) {
        invoiceLines.push({
          ...commonData,
          type: line.recordType,
          dueAmount: line.remainingAmount || line.amountDue || line.paymentAmount || 0
        });
      }
    });
    
    return { invoices: invoiceLines };
  }, [isViewMode, recordType]);

  // Fetch data when component mounts or entity ID changes
  useEffect(() => {
    const fetchData = async () => {
      console.log('═══════════════════════════════════════════');
      console.log('🔄 PaymentLine useEffect triggered');
      console.log('📋 Props:', {
        mode,
        isViewMode,
        paymentId,
        customerId,
        vendorId,
        locationId,
        recordType
      });

      if (recordType !== 'CustomerPayment' && recordType !== 'VendorPayment') {
        console.log('⚠️ Invalid recordType, clearing invoices');
        setInvoices([]);
        return;
      }

      const entityId = customerId || vendorId;
      console.log('🔑 Entity ID:', entityId);

      if (!entityId && !isViewMode && !paymentId) {
        console.log('⚠️ No entity ID and not in view mode, clearing invoices');
        setInvoices([]);
        return;
      }
      
      // In view mode with paymentId, fetch payment lines data
      if (isViewMode && paymentId) {
        setLoading(true);
        setError(null);
        
        try {
          const paymentLinesData = await fetchPaymentLines(paymentId);
          setViewModeData(paymentLinesData);
          
          // Transform and set the data
          const { invoices: transformedInvoices } = 
            transformPaymentLinesData(paymentLinesData);
            
          setInvoices(transformedInvoices);
          
          // Set payment amount from API data
          const paymentRecord = recordType === 'CustomerPayment' 
            ? paymentLinesData.customerPayment 
            : paymentLinesData.vendorPayment;
          if (paymentRecord) {
            setPaymentAmountStr(paymentRecord.amount.toString());
          }
          
          // Calculate totals for view mode
          const totalApplied = transformedInvoices.reduce((sum, inv) => sum + inv.displayAmount, 0);
          setAppliedTo(totalApplied);
          setUnapplied(0); // No unapplied amount in view mode
        } catch (err) {
          setError(err.message);
          setInvoices([]);
        } finally {
          setLoading(false);
        }
        return;
      }
      
      // Edit mode logic - fetch payment lines and build record map
      if (mode === 'edit' && paymentId && entityId) {
        console.log('Entering edit mode - paymentId:', paymentId, 'entityId:', entityId);
        setLoading(true);
        setError(null);
        
        try {
          const { recordMap, invoices: editInvoices, paymentData } = 
            await fetchEditModeData(paymentId, customerId, vendorId);
          
          setInvoices(editInvoices);
          setViewModeData(paymentData);
          
          // Set payment amount from API data
          const paymentRecord = recordType === 'CustomerPayment' 
            ? paymentData?.customerPayment 
            : paymentData?.vendorPayment;
          if (paymentRecord) {
            setPaymentAmountStr(paymentRecord.amount.toString());
          }
          
          // Calculate totals for edit mode
          const totalApplied = editInvoices.reduce((sum, inv) => sum + (inv.checked ? inv.displayAmount : 0), 0);
          setAppliedTo(totalApplied);
          
          const paymentAmount = parseAmount(paymentRecord?.amount || 0);
          setUnapplied(Math.max(paymentAmount - totalApplied, 0));
        } catch (err) {
          console.log('Edit mode error:', err);
          setError(err.message);
          setInvoices([]);
        } finally {
          setLoading(false);
        }
        return;
      }
      
      // Normal create mode logic - require BOTH entity AND location
      console.log('🎯 Create mode - Checking requirements:', { entityId, locationId });

      if (!entityId || !locationId) {
        console.log('⚠️ CREATE MODE: Missing entity or location, clearing invoices');
        console.log('   - Entity ID:', entityId);
        console.log('   - Location ID:', locationId);
        setInvoices([]); // Clear invoices if either is missing
        return;
      }

      console.log('✅ CREATE MODE: Both entity and location present, proceeding with fetch');
      setLoading(true);
      setError(null);

      try {
        if (recordType === 'CustomerPayment') {
          console.log('👤 Fetching Customer Payment data...');
          const [invoiceData, debitMemoData] = await Promise.all([
            fetchInvoices(customerId, locationId),
            fetchDebitMemos(customerId, locationId)
          ]);

          console.log('📦 Raw data fetched:', {
            invoices: invoiceData?.length || 0,
            debitMemos: debitMemoData?.length || 0
          });

          // Combine invoices and debit memos
          const processedInvoices = buildInitialInvoices(invoiceData, debitMemoData);
          console.log('✨ Processed invoices count:', processedInvoices.length);
          console.log('📝 Processed invoices:', processedInvoices);

          setInvoices(processedInvoices);
        } else if (recordType === 'VendorPayment') {
          console.log('🏢 Fetching Vendor Payment data...');
          const vendorBillData = await fetchVendorBills(vendorId, locationId);

          console.log('📦 Raw vendor bill data fetched:', vendorBillData?.length || 0);

          // Process vendor bills
          const processedInvoices = buildInitialVendorBills(vendorBillData);
          console.log('✨ Processed vendor bills count:', processedInvoices.length);
          console.log('📝 Processed vendor bills:', processedInvoices);

          setInvoices(processedInvoices);
        }

        console.log('✅ Fetch completed successfully');

      } catch (err) {
        console.error('❌ Error in fetchData:', err);
        setError(err.message);
        setInvoices([]);
      } finally {
        setLoading(false);
        console.log('🏁 PaymentLine useEffect completed');
        console.log('═══════════════════════════════════════════');
      }
    };

    fetchData();
  }, [customerId, vendorId, locationId, recordType, isViewMode, paymentId, mode, fetchInvoices, fetchDebitMemos, fetchVendorBills, fetchPaymentLines, transformPaymentLinesData, fetchEditModeData]);

  // Derived header "select all" checks
  const headerInvChecked = useMemo(
    () => invoices.length > 0 && invoices.every((r) => r.checked),
    [invoices]
  );

  /* ===== Capacity helpers ===== */
  const getCashUnapplied = () => unapplied;


  const updateCheckboxDisabling = (nextInvoices, nextUnapplied) => {
    const capacity = nextUnapplied;

    return nextInvoices.map((row) => {
      const applied = row.displayAmount;
      const disabled = applied === 0 && capacity <= 0;
      return { ...row, disabled };
    });
  };

  /* ===== Core allocation engine (recalc) ===== */
  const recalc = (opt) => {
    // Use explicit args when we just changed one piece of state
    const paymentLimit = parseAmount(
      opt?.paymentAmountStr ?? paymentAmountStr
    );
    let cashAvail = paymentLimit;

    const currInvoices = opt?.invoices ?? invoices;

    // --- Build invoice models (grab what's currently shown) ---
    const invModels = currInvoices.map((row) => {
      const typedOrder = row.userTyped ? row.lockedSeq ?? Infinity : Infinity;
      const currentDisplayed = row.displayAmount;
      
      // In edit mode, use enhanced limit (dueAmount + originalDisplayAmount)
      const originalPayment = row.originalDisplayAmount || 0;
      const lineCap = mode === 'edit' && paymentId 
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
        lineCap, // Store the calculated limit
        checked: row.checked,
        userTyped: row.userTyped,
        typedOrder,
        typedRequested,
        stickyRequested,
        appliedCash: 0,
      };
    });

    // --- Phase A: honor typed rows (lock order, then oldest) ---
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

    // --- Phase B: preserve existing non-typed ("sticky") oldest-first ---
    const stickyList = invModels
      .filter((r) => r.typedRequested === 0 && r.stickyRequested > 0)
      .sort((a, b) => a.dateKey - b.dateKey);

    for (const inv of stickyList) {
      const already = inv.appliedCash;
      let target = Math.max(inv.stickyRequested - already, 0);
      if (target <= 0) continue;

      const cashUsed = Math.min(target, cashAvail);
      inv.appliedCash += cashUsed;
      cashAvail -= cashUsed;
    }

    // --- Phase C: allocate remainder to newly-checked & empty (oldest-first) ---
    const autoList = invModels
      .filter(
        (r) =>
          r.typedRequested === 0 &&
          r.stickyRequested === 0 &&
          r.checked === true
      )
      .sort((a, b) => a.dateKey - b.dateKey);

    for (const inv of autoList) {
      const already = inv.appliedCash;
      // In edit mode, for auto allocation use conservative approach (just due amount)
      // But for typed amounts, the lineCap limit is already applied above
      const stillDue = Math.max(inv.dueAmount - already, 0);
      if (stillDue <= 0) continue;

      let target = stillDue;

      const cashUsed = Math.min(target, cashAvail);
      inv.appliedCash += cashUsed;
      cashAvail -= cashUsed;
    }

    // --- Update invoices (amounts reflect actual applied; checkbox mirrors reality) ---
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


    // --- Totals ---
    const nextUnapplied = Math.max(paymentLimit - totalAppliedToInvoices, 0);

    // --- Disable checkboxes if no capacity left and row has 0 applied ---
    const disabledInvoices = updateCheckboxDisabling(
      nextInvoices,
      nextUnapplied
    );

    // Commit state
    setInvoices(disabledInvoices);
    setAppliedTo(totalAppliedToInvoices);
    setUnapplied(nextUnapplied);
  };

  /* ===== Handlers ===== */
  const onPaymentAmountChange = (e) => {
    const value = e.target ? e.target.value : (e.value?.toString() || '');
    setPaymentAmountStr(value);
    
    // Only recalc in create mode (not view mode)
    if (!isViewMode) {
      // In edit mode, only update unapplied amount without affecting checkboxes/amounts
      if (mode === 'edit') {
        const paymentAmount = parseAmount(value);
        const totalApplied = invoices.reduce((sum, inv) => sum + (inv.checked ? inv.displayAmount : 0), 0);
        const newUnapplied = Math.max(paymentAmount - totalApplied, 0);
        setUnapplied(newUnapplied);
      } else {
        // In create mode, use full recalc logic
        recalc({ paymentAmountStr: value });
      }
    }
  };

  const onClearAll = () => {
    const clearedInv = invoices.map((r) => ({
      ...r,
      displayAmount: 0,
      checked: false,
      userTyped: false,
      lockedSeq: null,
    }));
    lockSeqRef.current = 1;
    setInvoices(clearedInv);
    setPaymentAmountStr("");
    recalc({ invoices: clearedInv, paymentAmountStr: "" });
  };

  // Invoice checkbox toggle
  const onInvoiceCheckChange = (id, nextChecked) => {
    // Don't allow changes in view mode
    if (isViewMode) return;

    // Validate payment amount before allowing checkbox selection
    const paymentAmount = parseAmount(paymentAmountStr);
    if (nextChecked && (paymentAmount === 0 || !paymentAmountStr || paymentAmountStr === '')) {
      alert('Please enter a Payment Amount before selecting transactions.');
      return;
    }

    const row = invoices.find((r) => r.id === id);
    const capacity = getCashUnapplied();

    // In edit mode, allow checking if there's an original payment (like reference code)
    if (mode === 'edit' && nextChecked && capacity <= 0 && row.displayAmount === 0) {
      const originalPayment = row.originalDisplayAmount || 0;
      if (originalPayment === 0) {
        // No original payment and no capacity - block it
        return;
      }
      // Has original payment - allow checking
    } else if (mode !== 'edit' && nextChecked && capacity <= 0 && row.displayAmount === 0) {
      // Create mode - block if no capacity and no current amount
      return;
    }

    const nextInvoices = invoices.map((r) => {
      if (r.id !== id) return r;
      if (!nextChecked) {
        // unchecking clears and resets typing flags
        return {
          ...r,
          checked: false,
          displayAmount: 0,
          userTyped: false,
          lockedSeq: null,
        };
      }
      // When checking in edit mode, restore original amount if available (like reference code)
      if (mode === 'edit' && r.displayAmount === 0) {
        const originalPayment = r.originalDisplayAmount || 0;
        return { 
          ...r, 
          checked: true,
          displayAmount: originalPayment,
          userTyped: originalPayment > 0
        };
      }
      // otherwise allow; recalc will allocate if possible
      return { ...r, checked: true };
    });

    setInvoices(nextInvoices);
    recalc({ invoices: nextInvoices });
  };

  // Invoice PAYMENT input focus: snapshot start value and unapplied-at-focus
  const onInvoiceInputFocus = (id) => {
    const row = invoices.find((r) => r.id === id);
    editCtxRef.current.set(id, {
      startAmount: row.displayAmount,
      unappliedAtFocus: unapplied,
    });
  };

  // Invoice PAYMENT input blur: clear snapshot
  const onInvoiceInputBlur = (id) => {
    editCtxRef.current.delete(id);
  };

  // Invoice PAYMENT input change (NetSuite-like clamp to start + unappliedAtFocus)
  const onInvoiceInputChange = (id, raw) => {
    const row = invoices.find((r) => r.id === id);
    const ctx = editCtxRef.current.get(id) || {
      startAmount: row.displayAmount,
      unappliedAtFocus: unapplied,
    };
    const due = row.dueAmount;
    const start = ctx.startAmount || 0;
    const unappliedAtFocus = ctx.unappliedAtFocus || 0;
    
    // In edit mode, use amountDue + originalDisplayAmount as limit (like reference code)
    let maxForRow;
    if (mode === 'edit' && paymentId) {
      // For edit mode: limit is amountDue + originalDisplayAmount (paid amount)
      const originalPayment = row.originalDisplayAmount || 0;
      const lineCap = due + originalPayment; // same as reference code: due + paid
      maxForRow = clamp(start + unappliedAtFocus, 0, lineCap);
    } else {
      // For create mode: standard limit is just the due amount
      maxForRow = clamp(start + unappliedAtFocus, 0, due);
    }

    const handleInvoiceAmountChange = (id, value) => {
      const nextInvoices = invoices.map((r) => {
        if (r.id !== id) return r;
        const amount = parseAmount(value);
        
        // In view mode, don't allow changes
        if (isViewMode) return r;
        
        return {
          ...r,
          displayAmount: amount,
          userTyped: true,
          lockedSeq: r.lockedSeq || lockSeqRef.current++,
        };
      });

      setInvoices(nextInvoices);
      
      // Only recalc in create mode (no paymentId) or when not in view mode
      if (!isViewMode) {
        recalc({ invoices: nextInvoices });
      }
    };

    let v = parseAmount(raw);
    v = clamp(v, 0, maxForRow);

    handleInvoiceAmountChange(id, v);
  };



  // Header select-all for invoices
  const onHeaderInvoicesToggle = (checking) => {
    // Don't allow changes in view mode
    if (isViewMode) return;

    // Validate payment amount before allowing checkbox selection
    const paymentAmount = parseAmount(paymentAmountStr);
    if (checking && (paymentAmount === 0 || !paymentAmountStr || paymentAmountStr === '')) {
      alert('Please enter a Payment Amount before selecting transactions.');
      return;
    }

    const nextInvoices = invoices.map((r) => {
      if (checking) {
        // In edit mode, restore original amounts when checking (like reference code)
        if (mode === 'edit' && r.displayAmount === 0) {
          const originalPayment = r.originalDisplayAmount || 0;
          return { 
            ...r, 
            checked: true,
            displayAmount: originalPayment,
            userTyped: originalPayment > 0
          };
        }
        return { ...r, checked: true };
      } else {
        return {
          ...r,
          checked: false,
          displayAmount: 0,
          userTyped: false,
          lockedSeq: null,
        };
      }
    });
    setInvoices(nextInvoices);
    recalc({ invoices: nextInvoices });
  };


  /* ===== Render ===== */
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
        .subtab-content { display: none; padding: 20px; }
        .subtab-content.active { display: block; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        thead { background-color: #f7f9fa; }
        th { font-weight: 600; color: #555; }
        tr:hover { background-color: #f5f5f5; }
        .text-right { text-align: right; }
        .k-checkbox { width: 16px; height: 16px; cursor: pointer; }
        .k-checkbox-wrapper .k-checkbox {
          border: 3px solid #000 !important;
          background-color: #fff !important;
          box-shadow: 0 0 0 1px #000 !important;
        }
        .k-checkbox-wrapper .k-checkbox:checked {
          background-color: #000 !important;
          border-color: #000 !important;
          box-shadow: 0 0 0 1px #000 !important;
        }
        .k-checkbox-wrapper .k-checkbox:checked::after {
          color: #fff !important;
          font-weight: bold !important;
          font-size: 12px !important;
        }
        .k-checkbox-wrapper .k-checkbox:hover {
          border-color: #000 !important;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3) !important;
        }
        .payment-input .k-numerictextbox { width: 90%; }
        .payment-input .k-numerictextbox .k-input { text-align: right; }
      `}</style>

      <div className="header-bar">
        <div>
          <label htmlFor="paymentAmountLimit">PAYMENT AMOUNT *</label>
          <NumericTextBox
            id="paymentAmountLimit"
            placeholder="0.00"
            min={0}
            step={0}
            format="n2"
            decimals={2}
            spinners={false}
            value={paymentAmountStr ? parseFloat(paymentAmountStr) : null}
            onChange={(e) => onPaymentAmountChange(e)}
            disabled={isViewMode}
          />
        </div>
        {/* Auto Apply removed */}
      </div>

      {(recordType === 'CustomerPayment' || recordType === 'VendorPayment') && (
        <div className="main-controls-area">
          <div className="controls-top-row">
            <div>
              <Button id="clearBtn" onClick={onClearAll} disabled={isViewMode}>
                Clear All
              </Button>
            </div>
          </div>

          <div className="subtab-nav">
            <Button
              type="button"
              className={`subtab-link ${tab === "invoices" ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTab("invoices");
              }}
              disabled={isViewMode && invoices.length === 0}
            >
              {recordType === 'CustomerPayment' ? 'Invoices/Debitmemos' : 'Vendor Bills'}
            </Button>
          </div>
        </div>
      )}

      {(recordType === 'CustomerPayment' || recordType === 'VendorPayment') && (
        <div className="subtab-header">
          <span>
            Applied : <strong id="appliedToTotalDisplay">{appliedTo.toFixed(2)}</strong>
          </span>
          {!isViewMode && (
            <>
              <span>&bull;</span>
              <span>
                Unapplied Amount : <strong id="unappliedAmountDisplay">{unapplied.toFixed(2)}</strong>
              </span>
            </>
          )}
        </div>
      )}

      {/* Records - Show for both CustomerPayment and VendorPayment */}
      {(recordType === 'CustomerPayment' || recordType === 'VendorPayment') && (
        <div id="invoices" className={`subtab-content ${tab === "invoices" ? "active" : ""}`}>
        {loading && tab === "invoices" ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Loading {recordType === 'CustomerPayment' ? 'invoices' : 'vendor bills'}...</p>
          </div>
        ) : error && tab === "invoices" ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
            <p>Error loading {recordType === 'CustomerPayment' ? 'invoices' : 'vendor bills'}: {error}</p>
            <Button onClick={() => recordType === 'CustomerPayment' ? fetchInvoices(customerId, locationId) : fetchVendorBills(vendorId, locationId)}>Retry</Button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  <Checkbox
                    className="header-checkbox"
                    checked={headerInvChecked}
                    onChange={(e) => onHeaderInvoicesToggle(e.value)}
                    disabled={isViewMode}
                  />
                </th>
                <th>DATE</th>
                <th>TYPE</th>
                <th>REF NO.</th>
                <th className="text-right">ORG AMT</th>
                {!isViewMode && <th className="text-right">AMT. DUE</th>}
                <th className="k-text-center">PAYMENT</th>
              </tr>
            </thead>
            <tbody id="invoiceTableBody">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={isViewMode ? "6" : "7"} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    {recordType === 'CustomerPayment' 
                      ? 'No invoices found for this customer' 
                      : 'No vendor bills found for this vendor'}
                  </td>
                </tr>
              ) : (
                invoices.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Checkbox
                        className="invoice-checkbox"
                        checked={row.checked}
                        disabled={isViewMode || row.disabled}
                        onChange={(e) => onInvoiceCheckChange(row.id, e.value)}
                      />
                    </td>
                    <td>{row.date}</td>
                    <td>{row.type}</td>
                    <td>{row.refNo}</td>
                    <td className="text-right">{(row.originalAmount || 0).toFixed(2)}</td>
                    {!isViewMode && <td className="text-right">{row.dueAmount.toFixed(2)}</td>}
                    <td className="text-right">
                      <div className="payment-input">
                        <NumericTextBox
                          className="invoice-payment-input"
                          style={{ textAlign: 'right !important' }}
                          min={0}
                          step={0}
                          format="n2"
                          decimals={2}
                          spinners={false}
                          value={row.displayAmount > 0 ? parseFloat(row.displayAmount) : null}
                          onFocus={() => !isViewMode && onInvoiceInputFocus(row.id)}
                          onBlur={() => !isViewMode && onInvoiceInputBlur(row.id)}
                          onChange={(e) => !isViewMode && onInvoiceInputChange(row.id, e.value?.toString() || '0')}
                          disabled={isViewMode}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        </div>
      )}
    </div>
  );
}
