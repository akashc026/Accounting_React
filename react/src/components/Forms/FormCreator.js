import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Field, FormElement, FieldArray } from '@progress/kendo-react-form';
import { Input, TextArea, NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import { clone } from '@progress/kendo-react-common';
import { FaSave, FaTimes, FaPlus, FaTrash, FaEdit, FaCheck, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';
import { apiConfig, buildUrl } from '../../config/api';
import { useChartOfAccount, useMasterData } from '../../hooks/useMasterData';

// Create React Context for editing
const FormGridEditContext = React.createContext({});
const FORM_DATA_INDEX = 'formDataIndex';
const DATA_ITEM_KEY = 'id';

// Validators
const requiredValidator = value => value ? '' : 'This field is required';

const FormCreator = ({ mode = 'new' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formDataReady, setFormDataReady] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState({
    formName: '',
    recordType: '',
    prefix: '',
    accountReceivable: '',
    undepositedFunds: '',
    clearingGRNI: '',
    clearingSRNI: '',
    clearingVAT: '',
    accountPayable: '',
    formType: '',
    clearing: '',
    accuredTax: '',
    accuredAR: '',
    discountOnTax: '',
    discounOnTaxDR: '',
    discountOnTaxCR: '',
    inactive: false,
    isDefault: false,
    customFields: [],
    reasons: []
  });

  // Check for incomplete fields before navigation
  const checkForIncompleteFields = () => {
    // Only check custom fields if there are any added (allow empty custom fields array)
    const incompleteCustomFields = formData.customFields && formData.customFields.length > 0
      ? formData.customFields.filter(field =>
          !field.fieldLabel?.trim() ||
          !field.fieldName?.trim() ||
          !field.fieldType ||
          !field.displayOrder ||
          field.displayOrder < 1
        )
      : [];

    // Only check reasons if there are any added (allow empty reasons array)
    const incompleteReasons = formData.reasons && formData.reasons.length > 0
      ? formData.reasons.filter(reason =>
          !reason.reason?.trim() ||
          !reason.accountId
        )
      : [];

    return incompleteCustomFields.length > 0 || incompleteReasons.length > 0;
  };

  // Handle navigation with unsaved changes
  const handleNavigation = (callback) => {
    if (checkForIncompleteFields()) {
      const confirmed = window.confirm(
        'You have incomplete fields that will be lost. Are you sure you want to continue?'
      );
      if (confirmed) {
        callback();
      }
    } else {
      callback();
    }
  };

  // Add beforeunload event listener to catch browser/drawer close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (checkForIncompleteFields()) {
        e.preventDefault();
        e.returnValue = 'You have incomplete fields that will be lost.';
        return 'You have incomplete fields that will be lost.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData]);

  // Dynamic data from APIs
  const [fieldTypes, setFieldTypes] = useState([]);
  const [recordTypes, setRecordTypes] = useState([]);
  
  // Chart of Account data for reasons dropdown
  const { data: chartOfAccountData, loading: chartOfAccountLoading } = useChartOfAccount();

  // Form Source Types data for form type dropdown
  const { data: formSourceTypesData, loading: formSourceTypesLoading } = useMasterData('form-source-type');

  // Fetch dynamic data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        
        // Fetch record types and field types in parallel
        const [recordTypesResponse, fieldTypesResponse] = await Promise.all([
          fetch(buildUrl(apiConfig.endpoints.recordType)),
          fetch(buildUrl('/type-of-field'))
        ]);

        if (!recordTypesResponse.ok) {
          throw new Error('Failed to fetch record types');
        }
        
        if (!fieldTypesResponse.ok) {
          throw new Error('Failed to fetch field types');
        }

        const recordTypesData = await recordTypesResponse.json();
        const fieldTypesData = await fieldTypesResponse.json();

        // Handle different API response formats
        const recordTypesArray = Array.isArray(recordTypesData) ? recordTypesData : recordTypesData.results || [];
        const fieldTypesArray = Array.isArray(fieldTypesData) ? fieldTypesData : fieldTypesData.results || [];



        // Transform record types data to dropdown format
        const transformedRecordTypes = recordTypesArray.map(item => ({
          text: item.name,
          value: item.id
        }));

        // Transform field types data to dropdown format with multiple fallback options
        const transformedFieldTypes = fieldTypesArray.map(item => {
          // Try multiple possible property names for the display text
          const displayName = item.componentName;

          // Try multiple possible property names for the value
          const value = item.id
          return {
            text: displayName,
            value: value
          };
        });

        setRecordTypes(transformedRecordTypes);
        setFieldTypes(transformedFieldTypes);
        
      } catch (error) {
        alert('Failed to load form data from API');

        // Set empty arrays on error - no fallback data
        setRecordTypes([]);
        setFieldTypes([]);
      }
    };

    fetchData();
  }, []);

  // Load form data when in edit or view mode (similar to SalesOrderForm pattern)
  useEffect(() => {
    const initializeForm = async () => {
      if (mode !== 'new' && id) {
        // Load existing form data
        try {
          setLoadingData(true);
          
          // Step 1: Load form header data
          const formResponse = await fetch(buildUrl(`${apiConfig.endpoints.forms}/${id}`), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (!formResponse.ok) {
            const errorText = await formResponse.text();
            throw new Error(`Failed to fetch form: ${formResponse.status} ${formResponse.statusText} - ${errorText}`);
          }

          const loadedFormData = await formResponse.json();

          // Step 2: Load custom form fields separately
          const customFieldsResponse = await fetch(buildUrl(apiConfig.endpoints.customFormFieldByForm(id)), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          let customFields = [];
          if (customFieldsResponse.ok) {
            try {
              const customFieldsData = await customFieldsResponse.json();
              
              // The API returns an array directly based on your JSON example
              if (Array.isArray(customFieldsData)) {
                customFields = customFieldsData;
              } else if (customFieldsData.results && Array.isArray(customFieldsData.results)) {
                customFields = customFieldsData.results;
              } else {
                customFields = [];
              }
              
              // Sort by display order
              customFields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            } catch (parseError) {
              customFields = [];
            }
          } else {
            customFields = [];
          }

          // Transform data for form - matching the expected structure
          const transformedData = {
            formName: loadedFormData.formName || '',
            recordType: loadedFormData.typeOfRecord || '',
            prefix: loadedFormData.prefix || '',
            accountReceivable: loadedFormData.accountReceivable || '',
            undepositedFunds: loadedFormData.undepositedFunds || '',
            clearingGRNI: loadedFormData.clearingGRNI || '',
            clearingSRNI: loadedFormData.clearingSRNI || '',
            clearingVAT: loadedFormData.clearingVAT || '',
            accountPayable: loadedFormData.accountPayable || '',
            formType: loadedFormData.formType || '',
            clearing: loadedFormData.clearing || '',
            accuredTax: loadedFormData.accuredTax || '',
            accuredAR: loadedFormData.accuredAR || '',
            discountOnTax: loadedFormData.discountOnTax || '',
            discounOnTaxDR: loadedFormData.discounOnTaxDR || '',
            discountOnTaxCR: loadedFormData.discountOnTaxCR || '',
            inactive: loadedFormData.inactive || false,
            isDefault: loadedFormData.isDefault || false,
            customFields: customFields.map((field, index) => ({
              id: field.id || index + 1,
              fieldName: field.fieldName || '',
              fieldLabel: field.fieldLabel || '',
              fieldType: field.fieldType || 'Input',
              isRequired: field.isRequired || false,
              isDisabled: field.isDisabled || false,
              source: field.fieldSource || '',
              displayOrder: field.displayOrder || index + 1,
              formDataIndex: index
            })),
            reasons: loadedFormData.reasons ? JSON.parse(loadedFormData.reasons) : []
          };

          setFormData(transformedData);
          setFormDataReady(true);
          
        } catch (err) {
          showNotification(err.message, 'error');
        } finally {
          setLoadingData(false);
        }
      } else {
        // For new mode, just finish loading once static data is loaded
        setFormDataReady(true);
        setLoadingData(false);
      }
    };

    initializeForm();
  }, [mode, id]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  };

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

  // Check if form name already exists
  const checkFormNameExists = async (formName, typeOfRecord) => {
    try {
      console.log('Checking form name:', formName, 'for type:', typeOfRecord);
      const url = buildUrl(`/form/check-name-exists?formName=${encodeURIComponent(formName)}&typeOfRecord=${typeOfRecord}`);
      console.log('API URL:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to check form name existence: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Form name check result:', result);
      return result;
    } catch (error) {
      console.error('Error checking form name:', error);
      throw error;
    }
  };

  // Check if prefix already exists
  const checkPrefixExists = async (prefix, typeOfRecord) => {
    try {
      console.log('Checking prefix:', prefix, 'for type:', typeOfRecord);
      const url = buildUrl(`/form/check-prefix-exists?prefix=${encodeURIComponent(prefix)}&typeOfRecord=${typeOfRecord}`);
      console.log('API URL:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to check prefix existence: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Prefix check result:', result);
      return result;
    } catch (error) {
      console.error('Error checking prefix:', error);
      throw error;
    }
  };

  // Check if there's an existing default form for the type of record
  const getDefaultFormId = async (typeOfRecord) => {
    try {
      console.log('Checking for existing default form for type:', typeOfRecord);
      const url = buildUrl(`/form/default-form-id/${typeOfRecord}`);
      console.log('API URL:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          // No default form exists, which is fine
          return null;
        }
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to check default form: ${response.status} - ${errorText}`);
      }

      const result = await response.text(); // API returns GUID as text
      console.log('Default form ID result:', result);
      // Remove quotes if the API returns the GUID wrapped in quotes
      const cleanedResult = result ? result.replace(/^"|"$/g, '').trim() : null;
      return cleanedResult || null;
    } catch (error) {
      console.error('Error checking default form:', error);
      throw error;
    }
  };

  // Update a form's isDefault status
  const updateFormDefaultStatus = async (formId, isDefault) => {
    try {
      console.log('Updating form default status:', formId, 'to:', isDefault);
      const url = buildUrl(`/form/${formId}/is-default`);
      console.log('API URL:', url);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDefault })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to update default status: ${response.status} - ${errorText}`);
      }

      console.log('Form default status updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating form default status:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!id) {
      showNotification('No form ID available for deletion', 'error');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this form? This action cannot be undone and will remove all associated custom fields and form sequences.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      // Step 1: Delete custom form fields
      try {
        const customFieldsResponse = await fetch(buildUrl(`/custom-form-field/by-form/${id}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (customFieldsResponse.ok) {
          const customFields = await customFieldsResponse.json();

          if (Array.isArray(customFields) && customFields.length > 0) {
            const deleteFieldPromises = customFields.map(field =>
              fetch(buildUrl(`${apiConfig.endpoints.customFormField}/${field.id}`), {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                }
              })
            );

            const deleteFieldResponses = await Promise.all(deleteFieldPromises);
            const failedFieldDeletes = deleteFieldResponses.filter(r => !r.ok);

            if (failedFieldDeletes.length > 0) {
              console.warn(`Failed to delete ${failedFieldDeletes.length} custom fields`);
            }
          }
        }
      } catch (customFieldError) {
        console.warn('Error deleting custom fields:', customFieldError);
      }

      // Step 2: Delete form sequence
      try {
        const formSequenceResponse = await fetch(buildUrl(`/form-sequence/by-form/${id}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (formSequenceResponse.ok) {
          const formSequences = await formSequenceResponse.json();

          if (Array.isArray(formSequences) && formSequences.length > 0) {
            const deleteSequencePromises = formSequences.map(sequence =>
              fetch(buildUrl(`${apiConfig.endpoints.formSequence}/${sequence.id}`), {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                }
              })
            );

            const deleteSequenceResponses = await Promise.all(deleteSequencePromises);
            const failedSequenceDeletes = deleteSequenceResponses.filter(r => !r.ok);

            if (failedSequenceDeletes.length > 0) {
              console.warn(`Failed to delete ${failedSequenceDeletes.length} form sequences`);
            }
          }
        }
      } catch (sequenceError) {
        console.warn('Error deleting form sequences:', sequenceError);
      }

      // Step 3: Delete main form record
      const formResponse = await fetch(buildUrl(`${apiConfig.endpoints.forms}/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!formResponse.ok) {
        const errorText = await formResponse.text();
        throw new Error(`Failed to delete form: ${formResponse.status} - ${errorText}`);
      }

      showNotification('Form deleted successfully', 'success');
      navigate('/forms');

    } catch (err) {
      showNotification(err.message || 'Failed to delete form', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formValues) => {
    try {
      setLoading(true);

      // Validate form name and prefix existence (only for create mode)
      if (mode === 'new') {
        try {
          // Check if form name already exists
          const formNameExists = await checkFormNameExists(formValues.formName, formValues.recordType);
          if (formNameExists) {
            alert('Form Name already exists for this Type of Record');
            return;
          }

          // Check if prefix already exists
          const prefixExists = await checkPrefixExists(formValues.prefix, formValues.recordType);
          if (prefixExists) {
            alert('Prefix already exists for this Type of Record');
            return;
          }
        } catch (error) {
          console.error('Validation error:', error);
          showNotification('Error checking form name or prefix. Please try again.', 'error');
          return;
        }
      }

      // Handle default form logic (for both create and edit modes)
      let finalIsDefault = formValues.isDefault;

      try {
        // Check if there's already a default form for this type of record
        const existingDefaultFormId = await getDefaultFormId(formValues.recordType);

        if (formValues.isDefault) {
          // User explicitly wants this form to be default
          if (existingDefaultFormId) {
            // If we're editing and the existing default is the current form, that's fine
            if (mode === 'edit' && existingDefaultFormId === id) {
              console.log('Current form is already the default, no change needed');
            } else {
              // Update the existing default form to false
              await updateFormDefaultStatus(existingDefaultFormId, false);
              console.log('Previous default form updated to false');
            }
          }
        } else if (mode !== 'edit' && !existingDefaultFormId) {
          // User didn't check isDefault, but there's no existing default form for this type
          // So automatically make this the default form (only for new forms)
          finalIsDefault = true;
          console.log('No existing default form found, automatically setting this form as default');
          showNotification('This form has been automatically set as the default for this record type.', 'info');
        }
      } catch (error) {
        console.error('Error handling default form logic:', error);
        showNotification('Error updating default form status. Please try again.', 'error');
        return;
      }

      if (mode === 'edit') {
        // Edit mode - update existing form

        const rawFormPayload = {
          formName: formValues.formName,
          typeOfRecord: formValues.recordType,
          prefix: formValues.prefix,
          accountReceivable: formValues.accountReceivable,
          undepositedFunds: formValues.undepositedFunds,
          clearingGRNI: formValues.clearingGRNI,
          clearingSRNI: formValues.clearingSRNI,
          clearingVAT: formValues.clearingVAT,
          accountPayable: formValues.accountPayable,
          formType: formValues.formType,
          clearing: formValues.clearing,
          accuredTax: formValues.accuredTax,
          accuredAR: formValues.accuredAR,
          discountOnTax: formValues.discountOnTax,
          discounOnTaxDR: formValues.discounOnTaxDR,
          discountOnTaxCR: formValues.discountOnTaxCR,
          inactive: formValues.inactive,
          isDefault: finalIsDefault,
          reasons: JSON.stringify(formValues.reasons || [])
        };

        const formPayload = cleanPayload(rawFormPayload);
        
        const formResponse = await fetch(buildUrl(`${apiConfig.endpoints.forms}/${id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formPayload)
        });
        
        if (!formResponse.ok) {
          const errorText = await formResponse.text();
          throw new Error(`Failed to update form: ${formResponse.status} - ${errorText}`);
        }
        
        // Handle custom fields updates in edit mode with smart diff logic
        if (formValues.customFields && formValues.customFields.length > 0) {
          // Step 1: Get existing custom fields for this form
          const existingFieldsResponse = await fetch(buildUrl(apiConfig.endpoints.customFormFieldByForm(id)), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          let existingFields = [];
          if (existingFieldsResponse.ok) {
            existingFields = await existingFieldsResponse.json();
            if (!Array.isArray(existingFields)) {
              existingFields = [];
            }
          }
          
          // Step 2: Create maps for efficient lookup
          const existingFieldsMap = new Map();
          existingFields.forEach(field => {
            existingFieldsMap.set(field.fieldName, field);
          });
          
          const newFieldsMap = new Map();
          formValues.customFields.forEach(field => {
            newFieldsMap.set(field.fieldName, field);
          });
          
          // Step 3: Identify fields to update, create, and delete
          const fieldsToUpdate = [];
          const fieldsToCreate = [];
          const fieldsToDelete = [];
          
          // Check each new field
          formValues.customFields.forEach(newField => {
            const existingField = existingFieldsMap.get(newField.fieldName);
            if (existingField) {
              // Field exists - check if it needs updating
              const needsUpdate = 
                existingField.fieldLabel !== newField.fieldLabel ||
                existingField.isRequired !== newField.isRequired ||
                existingField.isDisabled !== newField.isDisabled ||
                existingField.fieldType !== newField.fieldType ||
                existingField.fieldSource !== (newField.source || "") ||
                existingField.displayOrder !== newField.displayOrder;
              
              if (needsUpdate) {
                fieldsToUpdate.push({ existingField, newField });
              }
            } else {
              // Field doesn't exist - create it
              fieldsToCreate.push(newField);
            }
          });
          
          // Check for fields to delete (exist in database but not in form)
          existingFields.forEach(existingField => {
            if (!newFieldsMap.has(existingField.fieldName)) {
              fieldsToDelete.push(existingField);
            }
          });
          
          // Step 4: Execute updates
          const updatePromises = fieldsToUpdate.map(({ existingField, newField }) => {
            const fieldPayload = {
              fieldName: newField.fieldName,
              fieldLabel: newField.fieldLabel,
              isRequired: newField.isRequired,
              isDisabled: newField.isDisabled,
              fieldType: newField.fieldType,
              fieldSource: newField.source || "",
              displayOrder: newField.displayOrder,
              formId: id
            };
            
            return fetch(buildUrl(`${apiConfig.endpoints.customFormField}/${existingField.id}`), {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(fieldPayload)
            });
          });
          
          // Step 5: Execute creates
          const createPromises = fieldsToCreate.map(field => {
            const fieldPayload = {
              fieldName: field.fieldName,
              fieldLabel: field.fieldLabel,
              isRequired: field.isRequired,
              isDisabled: field.isDisabled,
              fieldType: field.fieldType,
              fieldSource: field.source || "",
              displayOrder: field.displayOrder,
              formId: id
            };
            
            return fetch(buildUrl(apiConfig.endpoints.customFormField), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(fieldPayload)
            });
          });
          
          // Step 6: Execute deletes
          const deletePromises = fieldsToDelete.map(field => 
            fetch(buildUrl(`${apiConfig.endpoints.customFormField}/${field.id}`), {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              }
            })
          );
          
          // Execute all operations
          const allPromises = [...updatePromises, ...createPromises, ...deletePromises];
          const allResponses = await Promise.all(allPromises);
          
          // Check for failures
          const failedOperations = allResponses.filter(r => !r.ok);
          if (failedOperations.length > 0) {
            throw new Error(`Some field operations failed. ${failedOperations.length} out of ${allResponses.length} operations failed.`);
          }
          
          showNotification(
            `Form updated successfully. ${fieldsToUpdate.length} fields updated, ${fieldsToCreate.length} fields created, ${fieldsToDelete.length} fields deleted.`, 
            'success'
          );
        } else {
          // If no custom fields provided, delete all existing ones
          const existingFieldsResponse = await fetch(buildUrl(apiConfig.endpoints.customFormFieldByForm(id)), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (existingFieldsResponse.ok) {
            const existingFields = await existingFieldsResponse.json();
            
            if (Array.isArray(existingFields) && existingFields.length > 0) {
              const deletePromises = existingFields.map(field => 
                fetch(buildUrl(`${apiConfig.endpoints.customFormField}/${field.id}`), {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                })
              );
              
              const deleteResponses = await Promise.all(deletePromises);
              
              const failedDeletes = deleteResponses.filter(r => !r.ok);
              if (failedDeletes.length > 0) {
                throw new Error(`Failed to delete ${failedDeletes.length} existing custom fields`);
              }
              
              showNotification(`Form updated successfully. ${existingFields.length} custom fields removed.`, 'success');
            } else {
              showNotification('Form updated successfully', 'success');
            }
          } else {
            showNotification('Form updated successfully', 'success');
          }
        }
        
        navigate('/forms');
      } else {
        const rawFormPayload = {
          formName: formValues.formName,
          typeOfRecord: formValues.recordType,
          prefix: formValues.prefix,
          accountReceivable: formValues.accountReceivable,
          undepositedFunds: formValues.undepositedFunds,
          clearingGRNI: formValues.clearingGRNI,
          clearingSRNI: formValues.clearingSRNI,
          clearingVAT: formValues.clearingVAT,
          accountPayable: formValues.accountPayable,
          formType: formValues.formType,
          clearing: formValues.clearing,
          accuredTax: formValues.accuredTax,
          accuredAR: formValues.accuredAR,
          discountOnTax: formValues.discountOnTax,
          discounOnTaxDR: formValues.discounOnTaxDR,
          discountOnTaxCR: formValues.discountOnTaxCR,
          inactive: formValues.inactive,
          isDefault: finalIsDefault,
          reasons: JSON.stringify(formValues.reasons || [])
        };

        const formPayload = cleanPayload(rawFormPayload);
        
        console.log(JSON.stringify(formPayload))
        const formResponse = await fetch(buildUrl(apiConfig.endpoints.forms), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formPayload)
        });
        
        if (!formResponse.ok) {
          const errorText = await formResponse.text();
          throw new Error(`Failed to create form: ${formResponse.status} - ${errorText}`);
        }
        
        const createdForm = await formResponse.json();
        
        // Handle different possible response structures
        let formId;
        
        if (typeof createdForm === 'string') {
          // API returns plain string GUID
          formId = createdForm;
        } else if (typeof createdForm === 'object') {
          // API returns JSON object with ID property
          formId = createdForm.id || createdForm.formId || createdForm.Id || createdForm.FormId;
        }
        
        if (!formId) {
          throw new Error('Form was created but no ID was returned from the server');
        }
        
        // Step 2: Create the custom form field records – For each item in the line, create CustomFormField records
        if (formValues.customFields && formValues.customFields.length > 0) {
          const fieldPromises = formValues.customFields.map(field => {
            const fieldPayload = {
              fieldName: field.fieldName,
              fieldLabel: field.fieldLabel,
              isRequired: field.isRequired,
              isDisabled: field.isDisabled,
              fieldType: field.fieldType,
              fieldSource: field.source || "",
              displayOrder: field.displayOrder,
              formId: formId
            };
            
            return fetch(buildUrl(apiConfig.endpoints.customFormField), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(fieldPayload)
            });
          });
          
          const fieldResponses = await Promise.all(fieldPromises);
          
          // Check if all field creations were successful
          for (let i = 0; i < fieldResponses.length; i++) {
            const response = fieldResponses[i];
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to create custom field ${i + 1}: ${response.status} - ${errorText}`);
            }
          }
        }
        
        // Step 3: Create the form sequence record – Use the formId reference to create FormSequence record
        const formSequencePayload = {
          formId: formId,
          formSequenceNumber: 0
        };
        
        const sequenceResponse = await fetch(buildUrl(apiConfig.endpoints.formSequence), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formSequencePayload)
        });
        
        if (!sequenceResponse.ok) {
          const errorText = await sequenceResponse.text();
          throw new Error(`Failed to create form sequence: ${sequenceResponse.status} - ${errorText}`);
        }
        
        showNotification('Form created successfully with all custom fields', 'success');
        navigate('/forms');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to save form', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validator = (values) => {
    const errors = {};
    
    if (!values.formName) {
      errors.formName = 'Form Name is required';
    }
    
    if (!values.recordType) {
      errors.recordType = 'Record Type is required';
    }
    
    return errors;
  };

  const TextInputField = (fieldRenderProps) => {
    const { validationMessage, visited, touched, value, ...others } = fieldRenderProps;
    // Only show validation errors if field has been touched AND blurred (visited) AND has validation message
    // OR if field has content but is invalid
    const showValidationMessage = validationMessage && (touched || (value && value.length > 0));
    
    return (
      <div>
        <Input 
          {...others} 
          value={value || ''}
          className={showValidationMessage ? 'k-state-invalid' : ''}
          style={{ width: '100%' }}
          disabled={mode === 'view'}
        />
        {showValidationMessage && (
          <div className="k-form-error">{validationMessage}</div>
        )}
      </div>
    );
  };

  const TextAreaField = (fieldRenderProps) => {
    const { validationMessage, visited, touched, value, ...others } = fieldRenderProps;
    // Only show validation errors if field has been touched AND has validation message
    // OR if field has content but is invalid
    const showValidationMessage = validationMessage && (touched || (value && value.length > 0));
    
    return (
      <div>
        <TextArea 
          {...others} 
          className={showValidationMessage ? 'k-state-invalid' : ''}
          style={{ width: '100%' }}
          disabled={mode === 'view'}
        />
        {showValidationMessage && (
          <div className="k-form-error">{validationMessage}</div>
        )}
      </div>
    );
  };

  const DropDownField = (fieldRenderProps) => {
    const { validationMessage, visited, touched, data, value, onChange, disabled, ...others } = fieldRenderProps;
    // Only show validation errors if field has been touched AND has validation message
    // OR if field has a value but is invalid
    const showValidationMessage = validationMessage && (touched || (value && value !== '' && value !== null));

    const handleChange = (e) => {
      const selectedValue = e.target.value?.value || e.target.value;
      onChange({ target: { value: selectedValue } });
    };

    // Handle empty data arrays
    const dropdownData = data || [];
    const hasData = dropdownData.length > 0;

    // Find the selected item based on value
    const selectedItem = value ? dropdownData.find(item => item.value === value) : null;

    return (
      <div>
        <DropDownList
          {...others}
          data={dropdownData}
          textField="text"
          valueField="value"
          defaultItem={{
            text: hasData ? "-- Select Record Type --" : "No data available",
            value: ""
          }}
          value={selectedItem}
          onChange={handleChange}
          className={showValidationMessage ? 'k-state-invalid' : ''}
          style={{ width: '100%' }}
          disabled={!hasData || mode === 'view' || disabled}
        />
        {showValidationMessage && (
          <div className="k-form-error">{validationMessage}</div>
        )}
      </div>
    );
  };

  const NumericTextBoxField = (fieldRenderProps) => {
    const { validationMessage, visited, touched, value, ...others } = fieldRenderProps;
    // Only show validation errors if field has been touched AND has validation message
    // OR if field has content but is invalid
    const showValidationMessage = validationMessage && (touched || (value !== null && value !== undefined && value !== ''));
    
    return (
      <div>
        <NumericTextBox 
          {...others} 
          step={0}
          className={showValidationMessage ? 'k-state-invalid' : ''}
          style={{ width: '100%' }}
          disabled={mode === 'view'}
        />
        {showValidationMessage && (
          <div className="k-form-error">{validationMessage}</div>
        )}
      </div>
    );
  };

  const DatePickerField = (fieldRenderProps) => {
    const { validationMessage, visited, ...others } = fieldRenderProps;
    const showValidationMessage = visited && validationMessage;
    
    return (
      <div>
        <DatePicker
          {...others}
          className={showValidationMessage ? 'k-state-invalid' : ''}
          style={{ width: '100%' }}
          disabled={mode === 'view'}
        />
        {showValidationMessage && (
          <div className="k-form-error">{validationMessage}</div>
        )}
      </div>
    );
  };

  const MultiSelectField = (fieldRenderProps) => {
    const { validationMessage, visited, data, ...others } = fieldRenderProps;
    const showValidationMessage = visited && validationMessage;
    
    // Handle empty data arrays
    const multiSelectData = data || [];
    const hasData = multiSelectData.length > 0;
    
    return (
      <div>
        <MultiSelect
          {...others}
          data={multiSelectData}
          textField="text"
          valueField="value"
          className={showValidationMessage ? 'k-state-invalid' : ''}
          style={{ width: '100%' }}
          disabled={!hasData || mode === 'view'}
          placeholder={hasData ? "Select options..." : "No data available"}
        />
        {showValidationMessage && (
          <div className="k-form-error">{validationMessage}</div>
        )}
      </div>
    );
  };

  // Custom field grid cell components
  const FieldLabelCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onUpdateField } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];

    if (isEditing) {
      return (
        <td style={{ padding: '4px' }}>
          <Input
            value={dataItem.fieldLabel || ''}
            onChange={(e) => onUpdateField(dataItem[FORM_DATA_INDEX], 'fieldLabel', e.target.value)}
            style={{ width: '100%', height: '32px' }}
            placeholder="Enter field label *"
          />
        </td>
      );
    }

    return (
      <td style={{ padding: '8px' }}>
        {dataItem.fieldLabel || 'Enter field label *'}
      </td>
    );
  };

  const FieldNameCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onUpdateField } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];

    if (isEditing) {
      return (
        <td style={{ padding: '4px' }}>
          <Input
            value={dataItem.fieldName || ''}
            onChange={(e) => onUpdateField(dataItem[FORM_DATA_INDEX], 'fieldName', e.target.value)}
            style={{ width: '100%', height: '32px' }}
            placeholder="Enter field name *"
          />
        </td>
      );
    }

    return (
      <td style={{ padding: '8px' }}>
        {dataItem.fieldName || 'Enter field name *'}
      </td>
    );
  };

  const FieldTypeCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onUpdateField } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];

    if (isEditing) {
      const hasFieldTypes = fieldTypes.length > 0;
      
      return (
        <td style={{ padding: '4px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <DropDownList
              value={hasFieldTypes ? fieldTypes.find(ft => ft.value === dataItem.fieldType) : null}
              onChange={(e) => onUpdateField(dataItem[FORM_DATA_INDEX], 'fieldType', e.target.value?.value || '')}
              data={fieldTypes}
              textField="text"
              valueField="value"
              defaultItem={{ 
                text: hasFieldTypes ? "Select type *" : "No field types available", 
                value: "" 
              }}
              style={{ 
                width: '100%',
                minWidth: '150px',
                zIndex: 1
              }}
              popupSettings={{
                appendTo: document.body,
                popupClass: 'field-type-dropdown-popup',
                position: 'bottom-start'
              }}
              disabled={!hasFieldTypes}
              className="field-type-dropdown"
            />
          </div>
        </td>
      );
    }

    return (
      <td style={{ padding: '8px' }}>
        <span className="field-type-display">
          {fieldTypes.find(ft => ft.value === dataItem.fieldType)?.text || 'Select type *'}
        </span>
      </td>
    );
  };

  const RequiredCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onUpdateField } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];

    if (isEditing) {
      return (
        <td style={{ padding: '8px', textAlign: 'center' }}>
          <input
            type="checkbox"
            checked={dataItem.isRequired || false}
            onChange={(e) => onUpdateField(dataItem[FORM_DATA_INDEX], 'isRequired', e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
        </td>
      );
    }

    return (
      <td style={{ padding: '8px', textAlign: 'center' }}>
        {dataItem.isRequired ? '✓' : ''}
      </td>
    );
  };

  const DisabledCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onUpdateField } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];

    if (isEditing) {
      return (
        <td style={{ padding: '8px', textAlign: 'center' }}>
          <input
            type="checkbox"
            checked={dataItem.isDisabled || false}
            onChange={(e) => onUpdateField(dataItem[FORM_DATA_INDEX], 'isDisabled', e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
        </td>
      );
    }

    return (
      <td style={{ padding: '8px', textAlign: 'center' }}>
        {dataItem.isDisabled ? '✓' : ''}
      </td>
    );
  };

  const DisplayOrderCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onUpdateField } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];

    if (isEditing) {
      return (
        <td style={{ padding: '4px' }}>
          <Input
            value={dataItem.displayOrder || 1}
            onChange={(e) => onUpdateField(dataItem[FORM_DATA_INDEX], 'displayOrder', parseInt(e.target.value) || 1)}
            type="number"
            style={{ width: '100%', height: '32px' }}
          />
        </td>
      );
    }

    return (
      <td style={{ padding: '8px' }}>
        {dataItem.displayOrder || 1}
      </td>
    );
  };

  const SourceCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onUpdateField } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];

    // Find the field type object to get the display text
    const fieldTypeObj = fieldTypes.find(ft => ft.value === dataItem.fieldType);
    
    // Check the field type display text
    const fieldTypeText = fieldTypeObj?.text?.toLowerCase() || '';
    const isDropdown = fieldTypeText.includes('dropdownlist');

    if (isEditing) {
      return (
        <td style={{ padding: '4px' }}>
          <Input
            value={dataItem.source || ''}
            onChange={(e) => onUpdateField(dataItem[FORM_DATA_INDEX], 'source', e.target.value)}
            style={{ 
              width: '100%', 
              height: '32px',
              backgroundColor: isDropdown ? '#ffffff' : '#f5f5f5'
            }}
            placeholder={isDropdown ? "/api/endpoint" : "Not applicable"}
            disabled={!isDropdown}
          />
        </td>
      );
    }

    return (
      <td style={{ padding: '8px' }}>
        {isDropdown ? (dataItem.source || 'Enter source') : '-'}
      </td>
    );
  };

  // Reasons Grid Cell Components
  const SerialNumberCell = (props) => {
    const { dataItem } = props;
    return (
      <td style={{ padding: '8px', textAlign: 'center' }}>
        {dataItem[FORM_DATA_INDEX] + 1}
      </td>
    );
  };

  const ReasonTextCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onUpdateReason } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];

    if (isEditing) {
      return (
        <td style={{ padding: '4px' }}>
          <Input
            value={dataItem.reason || ''}
            onChange={(e) => onUpdateReason(dataItem[FORM_DATA_INDEX], 'reason', e.target.value)}
            style={{ width: '100%', height: '32px' }}
            placeholder="Enter reason *"
          />
        </td>
      );
    }

    return (
      <td style={{ padding: '8px' }}>
        {dataItem.reason || 'Enter reason'}
      </td>
    );
  };

  const AccountCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onUpdateReason } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];

    if (isEditing) {
      const hasAccountData = chartOfAccountData && chartOfAccountData.length > 0;
      console.log(chartOfAccountData);
      const accountOptions = hasAccountData ? chartOfAccountData.map(account => ({
        text: `${account.name} - ${account.accountNumber}`,
        value: account.id
      })) : [];
      
      return (
        <td style={{ padding: '4px' }}>
          <DropDownList
            value={hasAccountData ? accountOptions.find(acc => acc.value === dataItem.accountId) : null}
            onChange={(e) => onUpdateReason(dataItem[FORM_DATA_INDEX], 'accountId', e.target.value?.value || '')}
            data={accountOptions}
            textField="text"
            valueField="value"
            defaultItem={{ 
              text: hasAccountData ? "Select account *" : "Loading accounts...", 
              value: "" 
            }}
            style={{ width: '100%' }}
            disabled={!hasAccountData || chartOfAccountLoading}
          />
        </td>
      );
    }

    const selectedAccount = chartOfAccountData?.find(acc => acc.id === dataItem.accountId);
    return (
      <td style={{ padding: '8px' }}>
        {selectedAccount ? `${selectedAccount.name} - ${selectedAccount.accountNumber}` : 'Select account *'}
      </td>
    );
  };

  const ReasonCommandCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onEdit, onSave, onCancel, onRemove } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];
    const isNewItem = !dataItem.id || dataItem.id === 0;

    // Don't show any actions in view mode
    if (mode === 'view') {
      return <td style={{ padding: '4px', textAlign: 'center' }}>-</td>;
    }

    return (
      <td style={{ padding: '2px', textAlign: 'center', width: '90px' }}>
        <div className="command-cell-container">
          {isEditing ? (
            <div className="button-stack">
              <Button
                type="button"
                onClick={() => onSave(dataItem)}
                className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-success command-btn save-btn stacked-btn"
                title={isNewItem ? 'Add this reason' : 'Save changes'}
              >
                Save
              </Button>
              <Button
                type="button"
                onClick={isNewItem ? () => onRemove(dataItem) : onCancel}
                className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-base command-btn cancel-btn stacked-btn"
                title={isNewItem ? 'Remove this reason' : 'Cancel editing'}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="button-stack">
              <Button
                type="button"
                onClick={() => onEdit(dataItem)}
                className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-primary command-btn edit-btn stacked-btn"
                title="Edit this reason"
              >
                Edit
              </Button>
              <Button
                type="button"
                onClick={() => onRemove(dataItem)}
                className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-danger command-btn delete-btn stacked-btn"
                title="Remove this reason"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </td>
    );
  };

  const CommandCell = (props) => {
    const { dataItem } = props;
    const { editIndex, onEdit, onSave, onCancel, onRemove } = React.useContext(FormGridEditContext);
    const isEditing = editIndex === dataItem[FORM_DATA_INDEX];
    const isNewItem = !dataItem.id || dataItem.id === 0;

    // Don't show any actions in view mode
    if (mode === 'view') {
      return <td style={{ padding: '4px', textAlign: 'center' }}>-</td>;
    }

    return (
      <td style={{ padding: '2px', textAlign: 'center', width: '90px' }}>
        <div className="command-cell-container">
          {isEditing ? (
            <div className="button-stack">
              <Button
                type="button"
                onClick={() => onSave(dataItem)}
                className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-success command-btn save-btn stacked-btn"
                title={isNewItem ? 'Add this field' : 'Save changes'}
              >
                Save
              </Button>
              <Button
                type="button"
                onClick={isNewItem ? () => onRemove(dataItem) : onCancel}
                className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-base command-btn cancel-btn stacked-btn"
                title={isNewItem ? 'Remove this field' : 'Cancel editing'}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="button-stack">
              <Button
                type="button"
                onClick={() => onEdit(dataItem)}
                className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-primary command-btn edit-btn stacked-btn"
                title="Edit this field"
              >
                Edit
              </Button>
              <Button
                type="button"
                onClick={() => onRemove(dataItem)}
                className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-danger command-btn delete-btn stacked-btn"
                title="Remove this field"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </td>
    );
  };

  // Custom Fields Grid Component
  const CustomFieldsGrid = (fieldArrayRenderProps) => {
    const { validationMessage, visited, name } = fieldArrayRenderProps;
    const [editIndex, setEditIndex] = useState(undefined);
    const editItemCloneRef = useRef(undefined);

    // Update a field value
    const onUpdateField = useCallback((index, fieldName, value) => {
      const currentItem = fieldArrayRenderProps.value[index];
      fieldArrayRenderProps.onReplace({
        index: index,
        value: {
          ...currentItem,
          [fieldName]: value
        }
      });
    }, [fieldArrayRenderProps]);

    // Add a new custom field
    const onAdd = useCallback((e) => {
      e.preventDefault();
      
      if (editIndex !== undefined) {
        return;
      }
      
      // Clear existing empty items first
      if (fieldArrayRenderProps.value.length === 1) {
        const existingItem = fieldArrayRenderProps.value[0];
        if (!existingItem.fieldLabel && !existingItem.fieldName) {
          setEditIndex(0);
          return;
        }
      }
      
      const newFieldId = fieldArrayRenderProps.value.length > 0 
        ? Math.max(...fieldArrayRenderProps.value.map(item => parseInt(item.id) || 0)) + 1 
        : 1;
        
      fieldArrayRenderProps.onUnshift({
        value: {
          id: 0, // Use 0 for new items to identify them as new
          fieldName: '',
          fieldLabel: '',
          fieldType: 'Input',
          isRequired: false,
          isDisabled: false,
          displayOrder: fieldArrayRenderProps.value.length + 1,
          source: ''
        }
      });
      
      setEditIndex(0);
    }, [fieldArrayRenderProps, editIndex]);

    // Remove a custom field
    const onRemove = useCallback((dataItem) => {
      fieldArrayRenderProps.onRemove({
        index: dataItem[FORM_DATA_INDEX]
      });
      
      setEditIndex(undefined);
      editItemCloneRef.current = undefined;
    }, [fieldArrayRenderProps]);

    // Edit a custom field
    const onEdit = useCallback((dataItem) => {
      editItemCloneRef.current = clone(dataItem);
      setEditIndex(dataItem[FORM_DATA_INDEX]);
    }, []);

    // Cancel editing
    const onCancel = useCallback(() => {
      if (editItemCloneRef.current) {
        fieldArrayRenderProps.onReplace({
          index: editItemCloneRef.current[FORM_DATA_INDEX],
          value: editItemCloneRef.current
        });
      }
      
      editItemCloneRef.current = undefined;
      setEditIndex(undefined);
    }, [fieldArrayRenderProps]);

    // Save changes
    const onSave = useCallback((dataItem) => {
      const index = dataItem[FORM_DATA_INDEX];
      const currentItem = fieldArrayRenderProps.value[index];
      
      // Enhanced validation - make all fields mandatory
      if (!currentItem.fieldLabel || !currentItem.fieldLabel.trim()) {
        alert('Field Label is required and cannot be empty');
        return;
      }
      
      if (!currentItem.fieldName || !currentItem.fieldName.trim()) {
        alert('Field Name is required and cannot be empty');
        return;
      }
      
      if (!currentItem.fieldType || currentItem.fieldType === '') {
        alert('Field Type selection is required');
        return;
      }
      
      if (!currentItem.displayOrder || currentItem.displayOrder < 1) {
        alert('Display Order is required and must be a positive number');
        return;
      }
      
      // Check for duplicate field names
      const existingField = fieldArrayRenderProps.value.find((item, idx) => 
        idx !== index && item.fieldName === currentItem.fieldName
      );
      
      if (existingField) {
        alert('Field name already exists. Please use a unique field name.');
        return;
      }
      
      // If this is a new item (id = 0), assign a proper ID
      if (currentItem.id === 0) {
        const newFieldId = fieldArrayRenderProps.value.length > 0 
          ? Math.max(...fieldArrayRenderProps.value.map(item => parseInt(item.id) || 0)) + 1 
          : 1;
        
        fieldArrayRenderProps.onReplace({
          index: index,
          value: { 
            ...currentItem, 
            id: newFieldId
          }
        });
      }
      
      setEditIndex(undefined);
      editItemCloneRef.current = undefined;
    }, [fieldArrayRenderProps]);

    const dataWithIndexes = fieldArrayRenderProps.value.map((item, index) => {
      return {
        ...item,
        [FORM_DATA_INDEX]: index
      };
    });

    return (
      <FormGridEditContext.Provider value={{
        onCancel,
        onEdit,
        onRemove,
        onSave,
        onUpdateField,
        editIndex,
        parentField: name
      }}>
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">Add Custom Fields</h3>
          </div>
          
          {mode !== 'view' && (
            <div className="add-field-container">
              <Button 
                onClick={onAdd}
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary add-field-btn"
              >
                <FaPlus /> Add Field
              </Button>
            </div>
          )}
          
          {visited && validationMessage && (
            <div className="k-form-error custom-fields-error">
              {validationMessage}
            </div>
          )}
        </div>
        
        <div className="custom-fields-grid-container">
          <Grid 
            data={dataWithIndexes} 
            dataItemKey={DATA_ITEM_KEY}
            className="custom-fields-grid"
          >
          <GridColumn field="fieldLabel" title="Field Label" width="180px" cells={{ data: FieldLabelCell }} />
          <GridColumn field="fieldName" title="Field Name" width="180px" cells={{ data: FieldNameCell }} />
          <GridColumn field="fieldType" title="Field Type" width="200px" cells={{ data: FieldTypeCell }} />
          <GridColumn field="isRequired" title="Required" width="80px" cells={{ data: RequiredCell }} />
          <GridColumn field="isDisabled" title="Disabled" width="80px" cells={{ data: DisabledCell }} />
          <GridColumn field="displayOrder" title="Order" width="70px" cells={{ data: DisplayOrderCell }} />
          <GridColumn field="source" title="Source" width="180px" cells={{ data: SourceCell }} />
          {mode !== 'view' && <GridColumn width="90px" cells={{ data: CommandCell }} />}
        </Grid>
        </div>
      </FormGridEditContext.Provider>
    );
  };

  // Add Reasons Grid Component
  const AddReasonsGrid = (fieldArrayRenderProps) => {
    const { validationMessage, visited, name } = fieldArrayRenderProps;
    const [editIndex, setEditIndex] = useState(undefined);
    const editItemCloneRef = useRef(undefined);

    // Update a reason field value
    const onUpdateReason = useCallback((index, fieldName, value) => {
      const currentItem = fieldArrayRenderProps.value[index];
      fieldArrayRenderProps.onReplace({
        index: index,
        value: {
          ...currentItem,
          [fieldName]: value
        }
      });
    }, [fieldArrayRenderProps]);

    // Add a new reason
    const onAdd = useCallback((e) => {
      e.preventDefault();
      
      if (editIndex !== undefined) {
        return;
      }
      
      // Clear existing empty items first
      if (fieldArrayRenderProps.value.length === 1) {
        const existingItem = fieldArrayRenderProps.value[0];
        if (!existingItem.reason && !existingItem.accountId) {
          setEditIndex(0);
          return;
        }
      }
      
      const newReasonId = fieldArrayRenderProps.value.length > 0 
        ? Math.max(...fieldArrayRenderProps.value.map(item => parseInt(item.id) || 0)) + 1 
        : 1;
        
      fieldArrayRenderProps.onUnshift({
        value: {
          id: 0, // Use 0 for new items to identify them as new
          reason: '',
          accountId: ''
        }
      });
      
      setEditIndex(0);
    }, [fieldArrayRenderProps, editIndex]);

    // Remove a reason
    const onRemove = useCallback((dataItem) => {
      fieldArrayRenderProps.onRemove({
        index: dataItem[FORM_DATA_INDEX]
      });
      
      setEditIndex(undefined);
      editItemCloneRef.current = undefined;
    }, [fieldArrayRenderProps]);

    // Edit a reason
    const onEdit = useCallback((dataItem) => {
      editItemCloneRef.current = clone(dataItem);
      setEditIndex(dataItem[FORM_DATA_INDEX]);
    }, []);

    // Cancel editing
    const onCancel = useCallback(() => {
      if (editItemCloneRef.current) {
        fieldArrayRenderProps.onReplace({
          index: editItemCloneRef.current[FORM_DATA_INDEX],
          value: editItemCloneRef.current
        });
      }
      
      editItemCloneRef.current = undefined;
      setEditIndex(undefined);
    }, [fieldArrayRenderProps]);

    // Save changes
    const onSave = useCallback((dataItem) => {
      const index = dataItem[FORM_DATA_INDEX];
      const currentItem = fieldArrayRenderProps.value[index];
      
      // Basic validation - make both fields mandatory
      if (!currentItem.reason || !currentItem.reason.trim()) {
        alert('Reason is required and cannot be empty');
        return;
      }
      
      if (!currentItem.accountId || currentItem.accountId === '') {
        alert('Account selection is required');
        return;
      }
      
      // If this is a new item (id = 0), assign a proper ID
      if (currentItem.id === 0) {
        const newReasonId = fieldArrayRenderProps.value.length > 0 
          ? Math.max(...fieldArrayRenderProps.value.map(item => parseInt(item.id) || 0)) + 1 
          : 1;
        
        fieldArrayRenderProps.onReplace({
          index: index,
          value: { 
            ...currentItem, 
            id: newReasonId
          }
        });
      }
      
      setEditIndex(undefined);
      editItemCloneRef.current = undefined;
    }, [fieldArrayRenderProps]);

    const dataWithIndexes = fieldArrayRenderProps.value.map((item, index) => {
      return {
        ...item,
        [FORM_DATA_INDEX]: index
      };
    });

    return (
      <FormGridEditContext.Provider value={{
        onCancel,
        onEdit,
        onRemove,
        onSave,
        onUpdateReason,
        editIndex,
        parentField: name
      }}>
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">Add Reasons</h3>
          </div>
          
          {mode !== 'view' && (
            <div className="add-field-container">
              <Button 
                onClick={onAdd}
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary add-field-btn"
              >
                <FaPlus /> Add Reason
              </Button>
            </div>
          )}
          
          {visited && validationMessage && (
            <div className="k-form-error custom-fields-error">
              {validationMessage}
            </div>
          )}
        </div>
        
        <div className="custom-fields-grid-container">
          <Grid 
            data={dataWithIndexes} 
            dataItemKey={DATA_ITEM_KEY}
            className="custom-fields-grid"
          >
          <GridColumn field="srNo" title="Sr No" width="80px" cells={{ data: SerialNumberCell }} />
          <GridColumn field="reason" title="Reason" width="300px" cells={{ data: ReasonTextCell }} />
          <GridColumn field="accountId" title="Account" width="300px" cells={{ data: AccountCell }} />
          {mode !== 'view' && <GridColumn width="90px" cells={{ data: ReasonCommandCell }} />}
        </Grid>
        </div>
      </FormGridEditContext.Provider>
    );
  };

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
          {mode === 'view' ? 'View Form' : mode === 'edit' ? 'Edit Form' : 'Create New Form'}
        </h2>
      </div>

      {loadingData || !formDataReady ? (
        <div className="loading-container">
          <div className="loading-spinner">Loading form data...</div>
        </div>
      ) : (
        <Form
        key={`form-${mode}-${id || 'new'}-${formDataReady}`}
        initialValues={formData}
        validator={validator}
        onSubmit={handleSubmit}
        render={(formRenderProps) => {
          return (
          <FormElement>
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: '1 / -1', marginBottom: '5px' }}>
                <Field
                  id="inactive"
                  name="inactive"
                  component={Checkbox}
                  label={<b> Inactive</b>}
                />
              </div>

              <div className="form-field" style={{ gridColumn: '1 / -1', marginBottom: '5px' }}>
                <Field
                  id="isDefault"
                  name="isDefault"
                  component={Checkbox}
                  label={<b> Is Default</b>}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Form Name *</label>
                <Field
                  id="formName"
                  name="formName"
                  component={TextInputField}
                  validator={requiredValidator}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Record Type *</label>
                <Field
                  id="recordType"
                  name="recordType"
                  component={DropDownField}
                  data={recordTypes}
                  validator={requiredValidator}
                  disabled={mode === 'edit'}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Prefix</label>
                <Field
                  id="prefix"
                  name="prefix"
                  component={TextInputField}
                />
              </div>


              {/* Account Receivable field - Only visible for invoice, debitmemo, and customerpayment record types */}
              {(() => {
                const selectedRecordType = formRenderProps.valueGetter('recordType');
                if (!selectedRecordType) return false;

                const recordType = recordTypes.find(rt => rt.value === selectedRecordType);
                if (!recordType) return false;

                const recordTypeName = recordType.text?.toLowerCase() || '';
                const isInvoice = recordTypeName.includes('invoice');
                const isDebitMemo = recordTypeName.includes('debitmemo') || recordTypeName.includes('debit memo');
                const isCustomerPayment = recordTypeName.includes('customerpayment') || recordTypeName.includes('customer payment');
                const isCreditMemo = recordTypeName.includes('creditmemo') || recordTypeName.includes('credit memo');

                return isInvoice || isDebitMemo || isCustomerPayment || isCreditMemo;
              })() && (
                <div className="form-field">
                  <label className="field-label">Account Receivable *</label>
                  <Field
                    id="accountReceivable"
                    name="accountReceivable"
                    component={DropDownField}
                    data={chartOfAccountData ? chartOfAccountData.map(account => ({
                      text: `${account.name} - ${account.accountNumber}`,
                      value: account.id
                    })) : []}
                    validator={requiredValidator}
                  />
                </div>
              )}

              {/* Undeposited Funds field - Only visible for customerpayment record type */}
              {(() => {
                const selectedRecordType = formRenderProps.valueGetter('recordType');
                if (!selectedRecordType) return false;

                const recordType = recordTypes.find(rt => rt.value === selectedRecordType);
                if (!recordType) return false;

                const recordTypeName = recordType.text?.toLowerCase() || '';
                const isCustomerPayment = recordTypeName.includes('customerpayment') || recordTypeName.includes('customer payment');

                return isCustomerPayment;
              })() && (
                <div className="form-field">
                  <label className="field-label">Undeposited Funds *</label>
                  <Field
                    id="undepositedFunds"
                    name="undepositedFunds"
                    component={DropDownField}
                    data={chartOfAccountData ? chartOfAccountData.map(account => ({
                      text: `${account.name} - ${account.accountNumber}`,
                      value: account.id
                    })) : []}
                    validator={requiredValidator}
                  />
                </div>
              )}

              {/* Clearing fields for itemreceipt record type */}
              {(() => {
                const selectedRecordType = formRenderProps.valueGetter('recordType');
                if (!selectedRecordType) return false;

                const recordType = recordTypes.find(rt => rt.value === selectedRecordType);
                if (!recordType) return false;

                const recordTypeName = recordType.text?.toLowerCase() || '';
                const isItemReceipt = recordTypeName.includes('itemreceipt') || recordTypeName.includes('item receipt');

                return isItemReceipt;
              })() && (
                <>
                  <div className="form-field">
                    <label className="field-label">Clearing (GRNI) *</label>
                    <Field
                      id="clearingGRNI"
                      name="clearingGRNI"
                      component={DropDownField}
                      data={chartOfAccountData ? chartOfAccountData.map(account => ({
                        text: `${account.name} - ${account.accountNumber}`,
                        value: account.id
                      })) : []}
                      validator={requiredValidator}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Clearing (SRNI) *</label>
                    <Field
                      id="clearingSRNI"
                      name="clearingSRNI"
                      component={DropDownField}
                      data={chartOfAccountData ? chartOfAccountData.map(account => ({
                        text: `${account.name} - ${account.accountNumber}`,
                        value: account.id
                      })) : []}
                      validator={requiredValidator}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Clearing VAT *</label>
                    <Field
                      id="clearingVAT"
                      name="clearingVAT"
                      component={DropDownField}
                      data={chartOfAccountData ? chartOfAccountData.map(account => ({
                        text: `${account.name} - ${account.accountNumber}`,
                        value: account.id
                      })) : []}
                      validator={requiredValidator}
                    />
                  </div>
                </>
              )}

              {/* Clearing fields and Account Payable for vendorbill record type */}
              {(() => {
                const selectedRecordType = formRenderProps.valueGetter('recordType');
                if (!selectedRecordType) return false;

                const recordType = recordTypes.find(rt => rt.value === selectedRecordType);
                if (!recordType) return false;

                const recordTypeName = recordType.text?.toLowerCase() || '';
                const isVendorBill = recordTypeName.includes('vendorbill') || recordTypeName.includes('vendor bill');

                return isVendorBill;
              })() && (
                <>
                  <div className="form-field">
                    <label className="field-label">Clearing (GRNI) *</label>
                    <Field
                      id="clearingGRNI"
                      name="clearingGRNI"
                      component={DropDownField}
                      data={chartOfAccountData ? chartOfAccountData.map(account => ({
                        text: `${account.name} - ${account.accountNumber}`,
                        value: account.id
                      })) : []}
                      validator={requiredValidator}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Clearing (SRNI) *</label>
                    <Field
                      id="clearingSRNI"
                      name="clearingSRNI"
                      component={DropDownField}
                      data={chartOfAccountData ? chartOfAccountData.map(account => ({
                        text: `${account.name} - ${account.accountNumber}`,
                        value: account.id
                      })) : []}
                      validator={requiredValidator}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Clearing VAT *</label>
                    <Field
                      id="clearingVAT"
                      name="clearingVAT"
                      component={DropDownField}
                      data={chartOfAccountData ? chartOfAccountData.map(account => ({
                        text: `${account.name} - ${account.accountNumber}`,
                        value: account.id
                      })) : []}
                      validator={requiredValidator}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Account Payable *</label>
                    <Field
                      id="accountPayable"
                      name="accountPayable"
                      component={DropDownField}
                      data={chartOfAccountData ? chartOfAccountData.map(account => ({
                        text: `${account.name} - ${account.accountNumber}`,
                        value: account.id
                      })) : []}
                      validator={requiredValidator}
                    />
                  </div>
                </>
              )}

              {/* Account Payable field for vendorPayment and vendorcredit record types */}
              {(() => {
                const selectedRecordType = formRenderProps.valueGetter('recordType');
                if (!selectedRecordType) return false;

                const recordType = recordTypes.find(rt => rt.value === selectedRecordType);
                if (!recordType) return false;

                const recordTypeName = recordType.text?.toLowerCase() || '';
                const isVendorPayment = recordTypeName.includes('vendorpayment') || recordTypeName.includes('vendor payment');
                const isVendorCredit = recordTypeName.includes('vendorcredit') || recordTypeName.includes('vendor credit');

                return isVendorPayment || isVendorCredit;
              })() && (
                <div className="form-field">
                  <label className="field-label">Account Payable *</label>
                  <Field
                    id="accountPayable"
                    name="accountPayable"
                    component={DropDownField}
                    data={chartOfAccountData ? chartOfAccountData.map(account => ({
                      text: `${account.name} - ${account.accountNumber}`,
                      value: account.id
                    })) : []}
                    validator={requiredValidator}
                  />
                </div>
              )}

              {/* Form Type field - Only for invoice and itemfulfillment record types */}
              {(() => {
                const selectedRecordType = formRenderProps.valueGetter('recordType');
                if (!selectedRecordType) return false;

                const recordType = recordTypes.find(rt => rt.value === selectedRecordType);
                if (!recordType) return false;

                const recordTypeName = recordType.text?.toLowerCase() || '';
                const isInvoice = recordTypeName.includes('invoice');
                const isItemFulfillment = recordTypeName.includes('itemfulfillment') || recordTypeName.includes('item fulfillment');

                return isInvoice || isItemFulfillment;
              })() && (
                <div className="form-field">
                  <label className="field-label">Form Type *</label>
                  <Field
                    id="formType"
                    name="formType"
                    component={DropDownField}
                    data={formSourceTypesData ? formSourceTypesData.map(item => ({
                      text: item.name || item.typeName || item.formSourceTypeName || `Form Source Type ${item.id}`,
                      value: item.id
                    })) : []}
                    validator={requiredValidator}
                  />
                </div>
              )}

              {/* Conditional fields based on Form Type selection - Only for invoice and itemfulfillment */}
              {(() => {
                const selectedRecordType = formRenderProps.valueGetter('recordType');
                const selectedFormType = formRenderProps.valueGetter('formType');

                if (!selectedRecordType || !selectedFormType) return null;

                const recordType = recordTypes.find(rt => rt.value === selectedRecordType);
                if (!recordType) return null;

                const recordTypeName = recordType.text?.toLowerCase() || '';
                const isInvoice = recordTypeName.includes('invoice');
                const isItemFulfillment = recordTypeName.includes('itemfulfillment') || recordTypeName.includes('item fulfillment');

                // Only show conditional fields for invoice and itemfulfillment (NOT for itemreceipt and vendorbill)
                if (!isInvoice && !isItemFulfillment) return null;

                // Get the selected form type text
                const formType = formSourceTypesData?.find(ft => ft.id === selectedFormType);
                const formTypeName = formType?.name?.toLowerCase() || formType?.typeName?.toLowerCase() || '';

                // Conditional logic based on Form Type selection
                const isExpenseClearing = formTypeName.includes('expense clearing');
                const isGAAP = formTypeName.includes('gaap') && !formTypeName.includes('discount');
                const isGAAPWithDiscount = formTypeName.includes('gaap') && formTypeName.includes('discount');

                const chartOfAccountOptions = chartOfAccountData ? chartOfAccountData.map(account => ({
                  text: `${account.name} - ${account.accountNumber}`,
                  value: account.id
                })) : [];

                return (
                  <>
                    {/* Clearing Acc - Only for Expense Clearing */}
                    {isExpenseClearing && (
                      <div className="form-field">
                        <label className="field-label">Clearing Acc *</label>
                        <Field
                          id="clearing"
                          name="clearing"
                          component={DropDownField}
                          data={chartOfAccountOptions}
                          validator={requiredValidator}
                        />
                      </div>
                    )}

                    {/* Accrued Tax - For GAAP and GAAP with Discount */}
                    {(isGAAP || isGAAPWithDiscount) && (
                      <div className="form-field">
                        <label className="field-label">Accrued Tax *</label>
                        <Field
                          id="accuredTax"
                          name="accuredTax"
                          component={DropDownField}
                          data={chartOfAccountOptions}
                          validator={requiredValidator}
                        />
                      </div>
                    )}

                    {/* Accrued AR - For GAAP and GAAP with Discount */}
                    {(isGAAP || isGAAPWithDiscount) && (
                      <div className="form-field">
                        <label className="field-label">Accrued AR *</label>
                        <Field
                          id="accuredAR"
                          name="accuredAR"
                          component={DropDownField}
                          data={chartOfAccountOptions}
                          validator={requiredValidator}
                        />
                      </div>
                    )}

                    {/* Discount - Always shown for invoice */}
                    {isInvoice && (
                      <div className="form-field">
                        <label className="field-label">Discount *</label>
                        <Field
                          id="discountOnTax"
                          name="discountOnTax"
                          component={DropDownField}
                          data={chartOfAccountOptions}
                          validator={requiredValidator}
                        />
                      </div>
                    )}

                    {/* DiscountOnTax Debit - Only for specific form type */}
                    {selectedFormType === 'a34b6525-52d9-4915-a095-65ec36d4b0f2' && (
                      <div className="form-field">
                        <label className="field-label">DiscountOnTax Debit *</label>
                        <Field
                          id="discounOnTaxDR"
                          name="discounOnTaxDR"
                          component={DropDownField}
                          data={chartOfAccountOptions}
                          validator={requiredValidator}
                        />
                      </div>
                    )}

                    {/* DiscountOnTax Credit - Only for specific form type */}
                    {selectedFormType === 'a34b6525-52d9-4915-a095-65ec36d4b0f2' && (
                      <div className="form-field">
                        <label className="field-label">DiscountOnTax Credit *</label>
                        <Field
                          id="discountOnTaxCR"
                          name="discountOnTaxCR"
                          component={DropDownField}
                          data={chartOfAccountOptions}
                          validator={requiredValidator}
                        />
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Add Reasons Grid - Only visible for inventory adjustment and inventory transfer */}
              {(() => {
                const selectedRecordType = formRenderProps.valueGetter('recordType');
                if (!selectedRecordType) return false;
                
                const recordType = recordTypes.find(rt => rt.value === selectedRecordType);
                if (!recordType) return false;
                
                const recordTypeName = recordType.text?.toLowerCase() || '';
                const isInventoryAdjustment = recordTypeName.includes('inventoryadjustment') || recordTypeName.includes('inventory adjustment');
                const isInventoryTransfer = recordTypeName.includes('inventorytransfer') || recordTypeName.includes('inventory transfer');
                
                return isInventoryAdjustment || isInventoryTransfer;
              })() && (
                <div className="order-items-field">
                  <FieldArray
                    name="reasons"
                    component={AddReasonsGrid}
                    dataItemKey={DATA_ITEM_KEY}
                  />
                </div>
              )}

              <div className="order-items-field">
                <FieldArray
                  name="customFields"
                  component={CustomFieldsGrid}
                  dataItemKey={DATA_ITEM_KEY}
                />
              </div>
            </div>

            <div className="form-actions">
              <Button
                type="button"
                onClick={() => handleNavigation(() => navigate('/forms'))}
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
              >
                <FaTimes /> {mode === 'view' ? 'Back' : 'Cancel'}
              </Button>
              {mode === 'edit' && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-danger"
                >
                  <FaTrashAlt /> {loading ? 'Deleting...' : 'Delete Form'}
                </Button>
              )}
              {mode !== 'view' && (
                <Button
                  type="submit"
                  disabled={loading || !formRenderProps.allowSubmit}
                  className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
                >
                  <FaSave /> {loading ? 'Saving...' : mode === 'edit' ? 'Update Form' : 'Save Form'}
                </Button>
              )}
            </div>
          </FormElement>
          );
        }}
      />
      )}

      <style>{`
        .form-container {
          background: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 16px;
          margin: 16px;
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

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }

        .loading-spinner {
          color: #4a5568;
          font-size: 16px;
          font-weight: 500;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .form-field {
          margin-bottom: 16px;
        }

        .field-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #4a5568;
          font-size: 14px;
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

        .k-form-error {
          color: #e53e3e;
          font-size: 12px;
          margin-top: 4px;
        }

        /* Form Section Styling - Matching MasterDataForm */
        .form-section {
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #f8f9ff 0%, #e8eeff 100%);
          border-radius: 6px;
          border-left: 4px solid #667eea;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .section-title {
          margin: 0;
          color: #2d3748;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .add-field-container {
          margin-bottom: 16px;
          padding-left: 4px;
        }

        .add-field-btn {
          background: #10b981 !important;
          border-color: #10b981 !important;
          color: white !important;
          font-weight: 600 !important;
          padding: 8px 16px !important;
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
        }

        .add-field-btn:hover {
          background: #059669 !important;
          border-color: #059669 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }

        .custom-fields-error {
          color: #e53e3e;
          font-size: 12px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #fed7d7;
          border: 1px solid #feb2b2;
          border-radius: 4px;
        }

        .custom-fields-grid-container {
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .custom-fields-grid {
          border: none !important;
          border-radius: 0 !important;
        }

        .custom-fields-grid .k-grid-header {
          background: #f8fafc !important;
          border-bottom: 2px solid #e2e8f0 !important;
        }

        .custom-fields-grid .k-grid-header th {
          font-weight: 600 !important;
          color: #4a5568 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
          padding: 12px 8px !important;
          border-right: 1px solid #e2e8f0 !important;
        }

        .custom-fields-grid .k-grid-header th:last-child {
          border-right: none !important;
        }

        .custom-fields-grid td {
          padding: 8px !important;
          border-right: 1px solid #f1f5f9 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          vertical-align: middle !important;
        }

        .custom-fields-grid td:last-child {
          border-right: none !important;
        }

        .custom-fields-grid .k-grid-content tr:hover {
          background-color: #f8fafc !important;
        }

        /* Grid specific styles for consistent field sizing */
        .custom-fields-grid .k-textbox,
        .custom-fields-grid .k-dropdownlist,
        .custom-fields-grid input[type="number"],
        .custom-fields-grid input[type="checkbox"] {
          height: 32px !important;
          font-size: 13px !important;
          padding: 6px 8px !important;
          border: 1px solid #d1d5db !important;
          border-radius: 4px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .custom-fields-grid .k-textbox:focus,
        .custom-fields-grid .k-dropdownlist:focus-within,
        .custom-fields-grid input[type="number"]:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
          outline: none !important;
        }

        .custom-fields-grid .k-dropdownlist {
          height: auto !important;
          min-width: 150px !important;
        }
        
        .custom-fields-grid .k-dropdownlist .k-input {
          height: 32px !important;
          padding: 6px 8px !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
          box-sizing: border-box !important;
        }
        
        .custom-fields-grid .k-dropdownlist .k-select {
          height: 30px !important;
          line-height: 30px !important;
          border: none !important;
        }
        
        /* Ensure dropdown popup is fully visible */
        .field-type-dropdown-popup {
          z-index: 10000 !important;
          min-width: 200px !important;
        }
        
        /* Ensure the dropdown arrow is properly aligned */
        .custom-fields-grid .k-dropdown-wrap {
          display: flex !important;
          align-items: center !important;
        }

        /* Field Type Dropdown Specific Styling */
        .field-type-dropdown {
          min-width: 120px !important;
        }

        .field-type-dropdown .k-dropdown-wrap {
          height: 32px !important;
          border: 1px solid #d1d5db !important;
          border-radius: 4px !important;
          background: white !important;
        }

        .field-type-dropdown .k-dropdown-wrap:hover {
          border-color: #9ca3af !important;
        }

        .field-type-dropdown .k-dropdown-wrap.k-state-focused {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }

        .field-type-display {
          font-size: 13px;
          color: #374151;
          font-weight: 500;
        }

        .custom-fields-grid input[type="checkbox"] {
          width: 18px !important;
          height: 18px !important;
          margin: 0 auto !important;
          display: block !important;
          cursor: pointer !important;
        }

        /* Command Cell Container */
        .command-cell-container {
          display: flex;
          flex-direction: row;
          gap: 2px;
          justify-content: center;
          align-items: center;
          min-height: 32px;
          width: 100%;
          padding: 1px;
        }
        
        .button-stack {
          display: flex;
          flex-direction: row;
          gap: 2px;
          width: 100%;
          align-items: center;
          justify-content: center;
        }

        /* Command Button Base Styles */
        .command-btn {
          height: 22px !important;
          padding: 2px 6px !important;
          font-size: 10px !important;
          font-weight: 500 !important;
          border-radius: 3px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          text-align: center !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
          white-space: nowrap !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
          margin: 0 !important;
        }
        
        .stacked-btn {
          width: 42px !important;
          max-width: 42px !important;
          min-width: 42px !important;
        }

        /* Save Button - Green */
        .save-btn {
          background: #16a34a !important;
          color: white !important;
          border-color: #15803d !important;
        }

        .save-btn:hover {
          background: #15803d !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25) !important;
        }

        .save-btn:active {
          transform: translateY(0) !important;
          box-shadow: 0 1px 2px rgba(22, 163, 74, 0.2) !important;
        }

        /* Cancel Button - Gray */
        .cancel-btn {
          background: #64748b !important;
          color: white !important;
          border-color: #475569 !important;
        }

        .cancel-btn:hover {
          background: #475569 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 6px rgba(100, 116, 139, 0.25) !important;
        }

        .cancel-btn:active {
          transform: translateY(0) !important;
          box-shadow: 0 1px 2px rgba(100, 116, 139, 0.2) !important;
        }

        /* Edit Button - Primary Blue */
        .edit-btn.k-button-solid-primary {
          background: #3b82f6 !important;
          border-color: #2563eb !important;
          color: white !important;
        }

        .edit-btn.k-button-solid-primary:hover {
          background: #2563eb !important;
          border-color: #1d4ed8 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
        }

        .edit-btn.k-button-solid-primary:active {
          transform: translateY(0) !important;
          box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2) !important;
        }

        /* Delete Button - Danger Red */
        .delete-btn.k-button-solid-danger {
          background: #ef4444 !important;
          border-color: #dc2626 !important;
          color: white !important;
        }

        .delete-btn.k-button-solid-danger:hover {
          background: #dc2626 !important;
          border-color: #b91c1c !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3) !important;
        }

        .delete-btn.k-button-solid-danger:active {
          transform: translateY(0) !important;
          box-shadow: 0 1px 2px rgba(239, 68, 68, 0.2) !important;
        }

        /* Button Focus States */
        .command-btn:focus {
          outline: 2px solid transparent !important;
          outline-offset: 2px !important;
        }

        .save-btn:focus {
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3) !important;
        }

        .cancel-btn:focus {
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.3) !important;
        }

        .edit-btn:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
        }

        .delete-btn:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3) !important;
        }

        /* Hide number input spinners */
        .custom-fields-grid input[type="number"]::-webkit-outer-spin-button,
        .custom-fields-grid input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }

        .custom-fields-grid input[type="number"] {
          -moz-appearance: textfield !important;
        }

        /* Center align specific columns */
        .custom-fields-grid td:nth-child(4),
        .custom-fields-grid td:nth-child(5),
        .custom-fields-grid td:nth-child(6) {
          text-align: center !important;
        }

        .custom-fields-grid th:nth-child(4),
        .custom-fields-grid th:nth-child(5),
        .custom-fields-grid th:nth-child(6) {
          text-align: center !important;
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
        }
      `}</style>
    </div>
  );
};

export default FormCreator; 