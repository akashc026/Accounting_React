import { useState, useCallback } from 'react';
import { apiConfig, buildUrl } from '../config/api';

const recordTypeCache = new Map();
const standardFieldsCache = new Map();
const formConfigCache = new Map();
const inflightRecordTypeRequests = new Map();
const inflightStandardFieldRequests = new Map();
const inflightFormConfigRequests = new Map();

const normalizeRecordTypeName = (name = '') => name.trim().toLowerCase();

// Custom hook for dynamic form functionality
export const useDynamicForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch record type ID by name
  const fetchRecordTypeId = useCallback(async (recordTypeName, options = {}) => {
    const { skipLoading = false, skipError = false } = options;
    const normalizedName = normalizeRecordTypeName(recordTypeName);

    if (!normalizedName) {
      throw new Error('Record type name is required');
    }

    if (recordTypeCache.has(normalizedName)) {
      return recordTypeCache.get(normalizedName);
    }

    if (inflightRecordTypeRequests.has(normalizedName)) {
      return inflightRecordTypeRequests.get(normalizedName);
    }

    const manageLoading = !skipLoading;

    if (manageLoading) {
      setLoading(true);
      if (!skipError) {
        setError(null);
      }
    } else if (!skipError) {
      setError(null);
    }

    const requestPromise = (async () => {
      try {
        const response = await fetch(buildUrl(`/record-type/by-name/${recordTypeName}`), {
          method: 'GET',
          headers: apiConfig.headers
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch record type: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        recordTypeCache.set(normalizedName, data);
        return data;
      } catch (err) {
        if (!skipError) {
          setError(err.message);
        }
        throw err;
      } finally {
        inflightRecordTypeRequests.delete(normalizedName);
        if (manageLoading) {
          setLoading(false);
        }
      }
    })();

    inflightRecordTypeRequests.set(normalizedName, requestPromise);
    return requestPromise;
  }, []);

  // Fetch standard fields for a record type
  const fetchStandardFields = useCallback(async (recordTypeId, recordTypeName, options = {}) => {
    const { skipLoading = false, skipError = false } = options;
    const cacheKey = String(recordTypeId || '');

    if (!recordTypeId) {
      throw new Error('Record type id is required to fetch standard fields');
    }

    if (standardFieldsCache.has(cacheKey)) {
      return standardFieldsCache.get(cacheKey);
    }

    if (inflightStandardFieldRequests.has(cacheKey)) {
      return inflightStandardFieldRequests.get(cacheKey);
    }

    const manageLoading = !skipLoading;

    if (manageLoading) {
      setLoading(true);
      if (!skipError) {
        setError(null);
      }
    } else if (!skipError) {
      setError(null);
    }

    const requestPromise = (async () => {
      try {
        const url = buildUrl(`/standard-field/by-record-type/${recordTypeId}`);
        const response = await fetch(url, {
          method: 'GET',
          headers: apiConfig.headers
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch standard fields: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const sortedFields = data.sort((a, b) => a.displayOrder - b.displayOrder);
        standardFieldsCache.set(cacheKey, sortedFields);
        return sortedFields;
      } catch (err) {
        if (!skipError) {
          setError(err.message);
        }
        throw err;
      } finally {
        inflightStandardFieldRequests.delete(cacheKey);
        if (manageLoading) {
          setLoading(false);
        }
      }
    })();

    inflightStandardFieldRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }, []);

  // Fetch complete form configuration (record type + fields)
  const fetchFormConfiguration = useCallback(async (recordTypeName) => {
    const normalizedName = normalizeRecordTypeName(recordTypeName);

    if (!normalizedName) {
      throw new Error('Record type name is required to fetch form configuration');
    }

    if (formConfigCache.has(normalizedName)) {
      return formConfigCache.get(normalizedName);
    }

    if (inflightFormConfigRequests.has(normalizedName)) {
      return inflightFormConfigRequests.get(normalizedName);
    }

    const requestPromise = (async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Get record type ID
        const recordType = await fetchRecordTypeId(recordTypeName, { skipLoading: true, skipError: true });

        // Step 2: Get standard fields
        const standardFields = await fetchStandardFields(recordType.id, recordTypeName, { skipLoading: true, skipError: true });

        // Step 3: Use only the fields returned by the API - no hardcoded additions
        const sortedFields = standardFields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        const config = {
          recordType,
          recordTypeId: recordType.id,
          standardFields: sortedFields
        };

        formConfigCache.set(normalizedName, config);
        return config;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
        inflightFormConfigRequests.delete(normalizedName);
      }
    })();

    inflightFormConfigRequests.set(normalizedName, requestPromise);
    return requestPromise;
  }, [fetchRecordTypeId, fetchStandardFields]);

  return {
    loading,
    error,
    fetchRecordTypeId,
    fetchStandardFields,
    fetchFormConfiguration
  };
};
