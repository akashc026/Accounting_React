import { useState, useEffect, useCallback } from 'react';
import { apiConfig, buildUrl } from '../config/api';

// Custom hook for dynamic form functionality
export const useDynamicForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch record type ID by name
  const fetchRecordTypeId = useCallback(async (recordTypeName) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(buildUrl(`/record-type/by-name/${recordTypeName}`), {
        method: 'GET',
        headers: apiConfig.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch record type: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch standard fields for a record type
  const fetchStandardFields = useCallback(async (recordTypeId, recordTypeName) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = buildUrl(`/standard-field/by-record-type/${recordTypeId}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: apiConfig.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch standard fields: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Sort fields by display order
      const sortedFields = data.sort((a, b) => a.displayOrder - b.displayOrder);
      
      return sortedFields;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch complete form configuration (record type + fields)
  const fetchFormConfiguration = useCallback(async (recordTypeName) => {
    try {
      setLoading(true);
      setError(null);
      
      // Step 1: Get record type ID
      const recordType = await fetchRecordTypeId(recordTypeName);
      
      // Step 2: Get standard fields
      const standardFields = await fetchStandardFields(recordType.id, recordTypeName);
      
      // Step 3: Use only the fields returned by the API - no hardcoded additions
      // Sort fields by display order
      const sortedFields = standardFields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      
      return {
        recordType,
        recordTypeId: recordType.id,
        standardFields: sortedFields
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRecordTypeId, fetchStandardFields]);

  return {
    loading,
    error,
    fetchRecordTypeId,
    fetchStandardFields,
    fetchFormConfiguration
  };
}; 