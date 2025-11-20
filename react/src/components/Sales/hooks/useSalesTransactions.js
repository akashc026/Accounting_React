import { useCallback, useEffect, useRef, useState } from 'react';
import { apiConfig } from '../../../config/api';

const useSalesTransactions = (recordType) => {
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
    if (!recordId || !['Invoice', 'DebitMemo'].includes(recordType)) {
      setTransactionsData([]);
      return [];
    }

    try {
      if (isMountedRef.current) {
        setTransactionsLoading(true);
      }

      const [customerPaymentResponse, creditMemoPaymentResponse] = await Promise.all([
        fetch(`${apiConfig.baseURL}/customer-payment-line/by-record-id/${recordId}`, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        }),
        fetch(`${apiConfig.baseURL}/credit-memo-payment-line/by-record-id/${recordId}`, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        })
      ]);

      const normalize = async (resp, type) => {
        if (!resp.ok) {
          if (resp.status !== 404) {
            console.warn(`Failed to fetch ${type}: ${resp.status}`);
          }
          return [];
        }
        const payload = await resp.json();
        return Array.isArray(payload)
          ? payload.map((item) => ({ ...item, transactionType: type }))
          : [];
      };

      const [customerPaymentData, creditMemoPaymentData] = await Promise.all([
        normalize(customerPaymentResponse, 'Customer Payment'),
        normalize(creditMemoPaymentResponse, 'Credit Memo')
      ]);

      const allTransactions = [...customerPaymentData, ...creditMemoPaymentData];

      allTransactions.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return (b.id || '').localeCompare(a.id || '');
      });

      if (isMountedRef.current) {
        setTransactionsData(allTransactions);
      }
      return allTransactions;
    } catch (err) {
      console.error('Error fetching transactions:', err);
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
    if (!recordId || recordType === 'SalesOrder') {
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
        if (isMountedRef.current) {
          setGlImpactData([]);
        }
        return [];
      }

      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [];
      if (isMountedRef.current) {
        setGlImpactData(normalized);
      }
      return normalized;
    } catch (err) {
      console.error('Error fetching GL Impact data:', err);
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

export default useSalesTransactions;
