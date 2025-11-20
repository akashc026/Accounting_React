import { useCallback, useEffect, useRef, useState } from 'react';
import { apiConfig } from '../../../config/api';

const usePurchaseTransactions = (recordType) => {
  const [transactionsData, setTransactionsData] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [glImpactData, setGlImpactData] = useState([]);
  const [glImpactLoading, setGlImpactLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadTransactions = useCallback(async (recordId) => {
    if (!recordId || recordType !== 'VendorBill') {
      setTransactionsData([]);
      return [];
    }

    try {
      if (isMountedRef.current) {
        setTransactionsLoading(true);
      }

      const [vendorPaymentResponse, vendorCreditPaymentResponse] = await Promise.all([
        fetch(`${apiConfig.baseURL}/vendor-payment-line/by-record-id/${recordId}`, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        }),
        fetch(`${apiConfig.baseURL}/vendor-credit-payment-line/by-record-id/${recordId}`, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        })
      ]);

      const normalize = async (response, type) => {
        if (!response.ok) {
          if (response.status !== 404) {
            console.warn(`Failed to fetch ${type} lines: ${response.status}`);
          }
          return [];
        }
        const payload = await response.json();
        return Array.isArray(payload)
          ? payload.map((item) => ({ ...item, transactionType: type }))
          : [];
      };

      const [vendorPaymentData, vendorCreditPaymentData] = await Promise.all([
        normalize(vendorPaymentResponse, 'Vendor Payment'),
        normalize(vendorCreditPaymentResponse, 'Vendor Credit')
      ]);

      const allTransactions = [...vendorPaymentData, ...vendorCreditPaymentData];
      allTransactions.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return (b.id || 0) - (a.id || 0);
      });

      if (isMountedRef.current) {
        setTransactionsData(allTransactions);
      }

      return allTransactions;
    } catch (error) {
      console.error('Error fetching purchase transactions:', error);
      if (isMountedRef.current) {
        setTransactionsData([]);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setTransactionsLoading(false);
      }
    }
  }, [recordType]);

  const loadGlImpact = useCallback(async (recordId) => {
    if (!recordId || recordType === 'PurchaseOrder') {
      setGlImpactData([]);
      return [];
    }

    try {
      if (isMountedRef.current) {
        setGlImpactLoading(true);
      }

      const response = await fetch(`${apiConfig.baseURL}/journal-entry-line/by-record-id/${recordId}`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status !== 404) {
          console.warn(`Failed to fetch GL Impact data: ${response.status}`);
        }
        setGlImpactData([]);
        return [];
      }

      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [];
      if (isMountedRef.current) {
        setGlImpactData(normalized);
      }
      return normalized;
    } catch (error) {
      console.error('Error fetching GL Impact data:', error);
      if (isMountedRef.current) {
        setGlImpactData([]);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setGlImpactLoading(false);
      }
    }
  }, [recordType]);

  const resetTransactions = useCallback(() => {
    setTransactionsData([]);
  }, []);

  const resetGlImpact = useCallback(() => {
    setGlImpactData([]);
  }, []);

  return {
    transactionsData,
    transactionsLoading,
    glImpactData,
    glImpactLoading,
    loadTransactions,
    loadGlImpact,
    resetTransactions,
    resetGlImpact
  };
};

export default usePurchaseTransactions;
