import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiConfig, buildUrl } from '../../config/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Field, FormElement } from '@progress/kendo-react-form';
import { Input, TextArea, NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import { FaSave, FaTimes, FaTrash } from 'react-icons/fa';
import { useDynamicForm } from '../../hooks/useDynamicForm';
import { processJournal } from '../../hooks/useJournal';
import JournalLines from './JournalLines';
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

const JournalForm = React.memo(({ recordType, mode = 'new' }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { loading: dynamicLoading, error: dynamicError, fetchFormConfiguration } = useDynamicForm();

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
  const [journalLines, setJournalLines] = useState([]);

  const [formInitialized, setFormInitialized] = useState(false);

  // Refs for cleanup
  const notificationTimerRef = React.useRef(null);

  // Journal form navigation
  const navigationPaths = {
    JournalEntry: '/journal-entry'
  };

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
      const response = await fetch(buildUrl('/record-type'), {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        signal
      });
      if (!response.ok) throw new Error(`Failed to fetch record types: ${response.status}`);
      const data = await response.json();
      return data.results || [];
    } catch (err) {
      if (err.name === 'AbortError') {
        return [];
      }
      return [];
    }
  }, []);

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

  // Handle journal lines changes
  const handleJournalLinesChange = useCallback((lines) => {
    console.log('📥 JournalForm: Received lines from JournalLines component:', lines);
    setJournalLines(lines);
    
    // Calculate total amount from lines
    const totalAmount = lines.reduce((sum, line) => {
      return sum + Math.max(parseFloat(line.debitAmount) || 0, parseFloat(line.creditAmount) || 0);
    }, 0);
    
    // Update form data with calculated total
    setFormData(prev => ({ ...prev, totalAmount }));
  }, []);

  const fetchCustomFormFields = async (formId) => {
    try {
      const response = await fetch(buildUrl(`/custom-form-field/by-form/${formId}`), {
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

  const combinedFormData = useMemo(() => {
    if (!formInitialized) return {};
    
    if (Object.keys(customFormData).length === 0) {
      return { ...formData, items: journalLines };
    }
    
    const customFieldsForForm = {};
    Object.keys(customFormData).forEach(key => {
      customFieldsForForm[`custom_${key}`] = customFormData[key];
    });
    
    const combined = { ...formData, ...customFieldsForForm, items: journalLines };
    console.log('🔧 JournalForm: Combined form data:', { 
      formDataKeys: Object.keys(formData), 
      journalLinesLength: journalLines?.length || 0,
      combinedItems: combined.items?.length || 0 
    });
    return combined;
  }, [formData, customFormData, formInitialized, journalLines]);

  const validator = useCallback((values) => {
    const errors = {};
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
  }, [formConfig]);

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

  // Helper function to get record type ID
  const getTypeOfRecordId = useCallback(() => {
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
      rt.name?.toLowerCase() === recordType?.toLowerCase()
    );
    
    if (foundRecordType) {
      return foundRecordType.id;
    }

    return null;
  }, [formConfig, recordTypes, recordType]);

  const initializeFormData = useCallback((fields) => {
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
  }, []);

  const fetchCustomFieldValues = useCallback(async (recordId, typeOfRecordId, customFields = []) => {
    try {
      if (!typeOfRecordId) {
        return { customData: {}, customFieldIds: {} };
      }

      const response = await fetch(buildUrl(apiConfig.endpoints.customFieldValueByTypeAndRecord(typeOfRecordId, recordId)), {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        return {};
      }
      
      const customFieldValues = await response.json();
      const customData = {};
      const customFieldIds = {};
      
      const fieldTypeMap = {};
      customFields.forEach(field => {
        fieldTypeMap[field.fieldName] = field.fieldTypeName;
      });
      
      if (Array.isArray(customFieldValues)) {
        customFieldValues.forEach(cfv => {
          if (cfv.customFieldName) {
            const fieldType = fieldTypeMap[cfv.customFieldName];
            let convertedValue = cfv.valueText;

            // Handle null/undefined/empty values - set appropriate defaults based on field type
            if (convertedValue === null || convertedValue === undefined || convertedValue === '') {
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

            switch (fieldType) {
              case 'DatePicker':
              case 'Date':
                if (typeof convertedValue === 'string' && convertedValue.trim() !== '') {
                  const dateValue = new Date(convertedValue);
                  convertedValue = isNaN(dateValue.getTime()) ? null : dateValue;
                }
                break;
                
              case 'NumericTextBox':
              case 'Number':
                if (typeof convertedValue === 'string' && convertedValue.trim() !== '') {
                  const numValue = parseFloat(convertedValue);
                  convertedValue = isNaN(numValue) ? 0 : numValue;
                }
                break;
                
              case 'Checkbox':
              case 'Switch':
                if (typeof convertedValue === 'string') {
                  convertedValue = convertedValue.toLowerCase() === 'true' || convertedValue === '1';
                }
                break;
                
              case 'MultiSelect':
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
            customFieldIds[cfv.customFieldName] = cfv.id;
          }
        });
      }
      
      return { customData, customFieldIds };
    } catch (err) {
      return { customData: {}, customFieldIds: {} };
    }
  }, []);

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
        fetch(buildUrl(`/form/${selectedValue}`), {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        }),
        fetch(buildUrl(`/form-sequence/by-form/${selectedValue}`), {
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
      if (hasSequenceNumberField && generatedSequenceNumber) {
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

  const getDropdownProps = useCallback((fieldRenderProps) => {
    const { name: fieldName } = fieldRenderProps;
    const fieldData = memoizedDropdownData[fieldName] || [];

    const selectedOption = fieldData.find(item => item.value === fieldRenderProps.value) || null;

    const handleChange = async (e) => {
      const selectedValue = e.target.value?.value || e.target.value;
      const valueToPass = (selectedValue === '' || selectedValue === undefined) ? null : selectedValue;
      
      // Call the original onChange if it exists
      if (fieldRenderProps.onChange) {
        fieldRenderProps.onChange({ target: { value: valueToPass } });
      }

      if (fieldName === 'form') {
        await handleFormSelection(valueToPass);
      }
    };

    return {
      data: fieldData,
      textField: 'text',
      valueField: 'value',
      value: selectedOption,
      onChange: handleChange
    };
  }, [memoizedDropdownData, handleFormSelection]);

  const getMultiSelectProps = useCallback((fieldRenderProps) => {
    const { name: fieldName } = fieldRenderProps;
    const fieldData = memoizedDropdownData[fieldName] || [];

    return {
      data: fieldData,
      textField: 'text',
      valueField: 'value'
    };
  }, [memoizedDropdownData]);

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
      number: { component: Input, props: { ...commonProps, type: 'number', min: 0, step: 0.01 } },
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
    const isMandatory = field.isMandatory;
    return isMandatory ? `${label} *` : label;
  };

  const getFieldValidator = useCallback((field, formRenderProps = null) => {
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

  const getCustomFieldValidator = useCallback((field) => {
    if (!field.isRequired) return undefined;
    return (value) => {
      if (!value || value === '') {
        return `${field.fieldLabel || field.fieldName} is required`;
      }
      return '';
    };
  }, []);

  const renderSingleField = useCallback((field, isCustom, isFullWidth = false, customKey = null, formRenderProps = null) => {
    const fieldName = isCustom ? `custom_${field.fieldName || field.name}` : field.name;
    const fieldId = isCustom ? field.fieldName || field.name : field.name;
    const key = customKey || `${isCustom ? 'custom' : 'standard'}-field-${field.id || fieldId}`;

    const label = isCustom
      ? `${field.fieldLabel || field.fieldName}${field.isRequired ? ' *' : ''}`
      : getFieldLabel(field, formRenderProps);

    const component = getFieldComponent(field);
    const fieldValidator = isCustom ? getCustomFieldValidator(field) : getFieldValidator(field, formRenderProps);
    const isCheckbox = field.fieldTypeName === 'Checkbox' || field.fieldTypeName === 'Switch';
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
            validator={fieldValidator}
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



  useEffect(() => {
    let isMounted = true;
    
    const loadFormData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        setFormInitialized(false);
        
        setCustomFormFields([]);
        setCustomFormData({});
        setCustomFieldValueIds({});
        setOriginalCustomFormData({});
        setSelectedFormId(null);
        
        const recordTypesData = await fetchRecordTypes();
        if (!isMounted) return;
        setRecordTypes(recordTypesData);
        
        const config = await fetchFormConfiguration(recordType);
        
        if (!isMounted) return;
        setFormConfig(config);
        
        const dropdownFields = config.standardFields.filter(field => 
          field.fieldTypeName === 'DropDownList' && field.source
        );
        
        const typeOfRecordId = getTypeOfRecordIdDirect(config, recordTypesData, recordType);
        
        const dropdownPromises = dropdownFields.map(async field => {
          let data;
          
           if (recordType === 'JournalEntry' && field.name === 'parent') {
             data = await fetchDropdownData(field.source);
             data = data.filter(item => item.isParent === true);
           }
           else if (field.name === 'form' && typeOfRecordId) {
            try {
              const response = await fetch(buildUrl(apiConfig.endpoints.formByTypeOfRecord(typeOfRecordId)), {
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
              });
              if (!response.ok) throw new Error(`Failed to fetch forms for record type: ${response.status}`);
              data = await response.json();
              data = Array.isArray(data) ? data : (data.results || data.data || []);
            } catch (err) {
              data = [];
            }
          } else {
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
        
        setDropdownData(dropdownDataMap);
        
        const initialFormData = initializeFormData(config.standardFields);

        if (mode !== 'new' && id) {
          try {
            let record = {};
            switch (recordType) {
              case 'JournalEntry': {
                const resp = await fetch(buildUrl(`/journal-entry/${id}`), {
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                });
                if (resp.ok) record = await resp.json();
                break;
              }
              default:
                console.warn(`No fetch method available for record type: ${recordType}`);
                record = {};
            }
            
            if (!isMounted) return;
            
            const recordData = record?.data || record || {};
            
            if (recordData && Object.keys(recordData).length > 0) {
              const mergedData = { ...initialFormData };
              
              config.standardFields.forEach(field => {
                if (recordData[field.name] !== undefined) {
                  let fieldValue = recordData[field.name];
                  
                  const isDateField = field.fieldTypeName === 'DatePicker' || 
                                    field.fieldTypeName === 'Date' || 
                                    field.fieldTypeName === 'date' ||
                                    field.name.toLowerCase().includes('date') ||
                                    field.name === 'soDate' ||
                                    field.name === 'invoiceDate' ||
                                    field.name === 'deliveryDate';
                  
                  if (isDateField && fieldValue && typeof fieldValue === 'string') {
                    const parsedDate = new Date(fieldValue);
                    fieldValue = isNaN(parsedDate.getTime()) ? null : parsedDate;
                  }
                  
                  mergedData[field.name] = fieldValue;
                }
              });
              
              const processedStandardFieldNames = config.standardFields.map(field => field.name);
              Object.keys(recordData).forEach(fieldName => {
                if (recordData[fieldName] !== undefined && !processedStandardFieldNames.includes(fieldName)) {
                  mergedData[fieldName] = recordData[fieldName];
                }
              });
              
              setFormData(mergedData);
              
              if (recordData.form) {
                try {
                  const customFields = await fetchCustomFormFields(recordData.form);
                  if (!isMounted) return;
                  
                  setCustomFormFields(customFields);
                  setSelectedFormId(recordData.form);
              
                  if (customFields.length > 0) {
                    const initialCustomData = initializeFormData(customFields.map(f => ({ ...f, name: f.fieldName })));
                    
                    const typeOfRecordId = getTypeOfRecordIdDirect(config, recordTypesData, recordType);
                    const { customData: existingCustomFieldValues, customFieldIds } = await fetchCustomFieldValues(id, typeOfRecordId, customFields);
                    
                    if (!isMounted) return;
                    
                    setCustomFieldValueIds(customFieldIds);
                    
                    const existingCustomData = { ...initialCustomData, ...existingCustomFieldValues };
                    setCustomFormData(existingCustomData);
                    
                    setOriginalCustomFormData(existingCustomData);
                  }
                } catch (err) {
                  // Silent error handling for custom fields
                }
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
  }, [mode, id, recordType]);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      
      setCustomFormFields([]);
      setCustomFormData({});
      setCustomFieldValueIds({});
      setOriginalCustomFormData({});
      setSelectedFormId(null);
      setFormData({});
      setFormInitialized(false);
      setNotification({ show: false, message: '', type: 'success' });
    };
  }, []);


  const createMainRecord = async (standardData) => {
    try {
      let createdRecord;
      switch (recordType) {
        case 'JournalEntry': {
          const url = buildUrl('/journal-entry');
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(cleanPayload(standardData))
          });
          
          if (!resp.ok) {
            const errorText = await resp.text();
            throw new Error(`Failed to create JournalEntry: ${resp.status} - ${errorText}`);
          }
          
          createdRecord = await resp.json();
          break;
        }
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }
      
      let recordId = null;
      
      if (createdRecord?.id) {
        recordId = createdRecord.id;
      } else if (createdRecord?.data?.id) {
        recordId = createdRecord.data.id;
      } else if (typeof createdRecord === 'string') {
        recordId = createdRecord;
      } else {
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
      
      return recordId;
    } catch (error) {
      console.error(`Error creating ${recordType}:`, error);
      throw error;
    }
  };


  const createOrUpdateCustomFieldValues = async (recordId, typeOfRecord, customData) => {
    const customFieldPromises = Object.keys(customData).map(async fieldName => {
      const value = customData[fieldName];
      const customFieldId = customFormFields.find(f => f.fieldName === fieldName)?.id;
      const existingValueId = customFieldValueIds[fieldName];
  
      if (!customFieldId) return;
  
      const payload = {
        customFormFieldId: customFieldId,
        recordId: recordId,
        typeOfRecord: typeOfRecord,
        valueText: value,
      };
  
      const endpoint = existingValueId 
        ? buildUrl(apiConfig.endpoints.customFieldValueById(existingValueId))
        : buildUrl(apiConfig.endpoints.customFieldValue);
      
      const method = existingValueId ? 'PUT' : 'POST';
  
      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanPayload(payload)),
        });
        if (!response.ok) {
          console.error(`Failed to save custom field ${fieldName}`);
        }
      } catch (err) {
        console.error(`Error saving custom field ${fieldName}: ${err.message}`);
      }
    });
  
    await Promise.all(customFieldPromises);
  };

  // Helper function to create transaction line items
  const createTransactionLineItems = async (headerId, lineItems) => {
      if (!lineItems || lineItems.length === 0) return;
      // Transform journal lines to useJournal format
      const changes = lineItems.map(line => ({
        jeid: headerId,
        accountId: line.accountID,
        newCredit: line.credit || 0,
        newDebit: line.debit || 0,
        oldCredit: 0,
        oldDebit: 0,
        memo: line.memo,
        id: null // New records
      }));
  
      // Use the useJournal hook
      await processJournal(changes, 'new');
  };

  
  
  const handleSubmit = async (formValues, submitEvent) => {
    console.log('🚀 handleSubmit called with:', { formValues, mode, recordType });
    console.log('📋 Submit event:', submitEvent);

    // Validate debit/credit balance before submission
    if (formValues.items && formValues.items.length > 0) {
      const totalDebit = formValues.items.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
      const totalCredit = formValues.items.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        alert(`Journal entry is not balanced!\n\nTotal Debit: ${totalDebit.toFixed(2)}\nTotal Credit: ${totalCredit.toFixed(2)}\n\nPlease ensure debit and credit amounts are equal before saving.`);
        return; // Prevent submission
      }
    }

    // Note: allowSubmit is not available in onSubmit callback, only in render props
    // The form will only call onSubmit if submission is allowed

    try {
      console.log('🔄 Starting form submission process...');
      setLoading(true);
      setError(null);

      const { standardData, customData } = separateFormData(formValues);
      console.log('📊 Separated form data:', { standardData, customData });
      
      if (mode === 'new') {
        console.log('🆕 Creating new record...');
        
        const newRecordId = await createMainRecord(standardData);
       
        const lineItems = formValues.items || [];
        if (lineItems.length > 0) {
          await createTransactionLineItems(newRecordId, lineItems);
        } else {
          console.log('ℹ️ No line items to create');
        }


        const typeOfRecordId = getTypeOfRecordId();
        await createOrUpdateCustomFieldValues(newRecordId, typeOfRecordId, customData);

        console.log('🎉 Record creation completed successfully!');
        showNotification(`${recordType} created successfully with ${Object.keys(customData).length} custom fields!`, 'success');
        navigate(navigationPaths[recordType] || '/');
      } else {
        const customFieldCount = await updateRecord(standardData, customData, getTypeOfRecordId());
        if (formValues.items && formValues.items.length > 0) {
          await updateTransactionLineItemsSimple(formValues.items);
        }

        showNotification(`${recordType} updated successfully with ${customFieldCount} custom fields`, 'success');
        navigate(navigationPaths[recordType] || '/');
      }

    } catch (err) {
      console.error('❌ Error in handleSubmit:', err);
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
      console.log('🏁 handleSubmit process completed');
    }
  };

  // Helper function to update transaction line items using useJournal hook
  const updateTransactionLineItemsSimple = async (newLineItems) => {
    if (!newLineItems || newLineItems.length === 0) return;

    // Get existing line items from API to compare old vs new values
    const getEndpoint = `${apiConfig.baseURL}/journal-entry-line/by-journal-entry/${id}`;

    try {
      const existingResponse = await fetch(getEndpoint, {
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
          const possibleArrays = Object.values(existingData).filter(value => Array.isArray(value));
          if (possibleArrays.length > 0) {
            existingItems = possibleArrays[0];
          }
        }
      }

      // Create map of existing items for easy lookup
      const existingItemsMap = new Map();
      existingItems.forEach(item => {
        if (item.id) {
          existingItemsMap.set(item.id, item);
        }
      });

      // Transform to useJournal format with old/new values
      const changes = newLineItems.map(line => {
        const existingItem = existingItemsMap.get(line.id);

        return {
          jeid: id,
          id: line.id || null,
          accountId: line.accountID,
          newCredit: Number(line.credit || 0),
          newDebit: Number(line.debit || 0),
          oldCredit: existingItem ? Number(existingItem.credit || 0) : 0,
          oldDebit: existingItem ? Number(existingItem.debit || 0) : 0,
          memo: line.memo
        };
      });

      console.log('🔄 Calling useJournal for edit operation with changes:', changes);

      // Use the useJournal hook for edit operation
      await processJournal(changes, 'edit');

    } catch (error) {
      throw new Error(`Failed to update line items: ${error.message}`);
    }
  };

  // Helper function to update main record and custom fields (exact PurchaseForm.js pattern)
  const updateRecord = async (standardData, customData, typeOfRecordId) => {
    // Stage 1: Update main record
    await updateMainRecord(id, standardData);

    // Stage 2: Update custom field values
    await createOrUpdateCustomFieldValues(id, typeOfRecordId, customData);

    return Object.keys(customData).length;
  };
  
  const updateMainRecord = async (recordId, standardData) => {
    try {
      let url;
      switch (recordType) {
        case 'JournalEntry':
          url = buildUrl(`/journal-entry/${recordId}`);
          break;
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }
      
      const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(cleanPayload(standardData))
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to update ${recordType}: ${resp.status} - ${errorText}`);
      }
      
      return await resp.json();
    } catch (error) {
      console.error(`Error updating ${recordType}:`, error);
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Step 1: Delete line items first (following PurchaseForm.js pattern)
      const transactionConfig = {
        JournalEntry: {
          endpoint: `${apiConfig.baseURL}/journal-entry-line`,
          getEndpoint: `${apiConfig.baseURL}/journal-entry-line/by-journal-entry/${id}`,
        }
      };

      const config = transactionConfig[recordType];
      if (config && config.getEndpoint) {
        // Get existing line items
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

        // Delete all line items using useJournal
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

          console.log('🔄 Calling useJournal for delete operation with changes:', changes);
          await processJournal(changes, 'delete');
        }
      }

      // Step 2: Delete custom field values
      const typeOfRecordId = getTypeOfRecordId();
      if (typeOfRecordId) {
        try {
          const customFieldValuesResponse = await fetch(buildUrl(`/custom-field-value/by-type-and-record?typeOfRecord=${typeOfRecordId}&recordId=${typeOfRecordId}`), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
          });

          if (customFieldValuesResponse.ok) {
            const customFieldValues = await customFieldValuesResponse.json();
            const valuesToDelete = Array.isArray(customFieldValues) ? customFieldValues : 
                                 (customFieldValues.results || []);

            if (valuesToDelete.length > 0) {
              const deleteCustomFieldPromises = valuesToDelete.map(value => {
                return fetch(buildUrl(`/custom-field-value/${value.id}`), {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                });
              });

              await Promise.all(deleteCustomFieldPromises);
            }
          }
        } catch (customFieldError) {
          // Continue with main record deletion even if custom field deletion fails
          console.warn('Failed to delete custom field values:', customFieldError);
        }
      }

      // Step 3: Delete main record
      let url;
      switch (recordType) {
        case 'JournalEntry':
          url = buildUrl(`/journal-entry/${id}`);
          break;
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }
      
      const resp = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to delete ${recordType}: ${resp.status} - ${errorText}`);
      }
      
      showNotification(`${recordType} deleted successfully!`, 'success');
      navigate(navigationPaths[recordType] || '/');
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };


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
      rt.name?.toLowerCase() === recordTypeName?.toLowerCase()
    );
    
    if (foundRecordType) {
      return foundRecordType.id;
    }
    
    return null;
  };


  if (loading || !formConfig || !formInitialized) {
    return (
      <div className="master-form-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <div>Loading {recordType.toLowerCase()} form...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="master-form-container">
        <div className="error-message">
          <h3>Error Loading {recordType}</h3>
          <p>{error}</p>
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

      <div className="master-form-header">
        <h2>
          {mode === 'new' ? `Create New ${recordType}` : 
           mode === 'edit' ? `Edit ${recordType}` : `View ${recordType}`}
        </h2>
      </div>

      <div className="master-form-element">
        <Form
          key={`${recordType.toLowerCase()}-form-${mode}-${id || 'new'}-${selectedFormId || 'no-form'}-items-${journalLines.length}`}
          initialValues={combinedFormData}
          validator={validator}
          onSubmit={handleSubmit}
          render={(formRenderProps) => (
            <FormElement>
              <div className="master-form-content">
                {/* Standard Fields Section */}
                <div className="form-section">
                  <div className="section-header">
                    <h3 className="section-title">Standard Fields</h3>
                  </div>
                  <div className="master-form-row">
                    {renderFields(formConfig?.standardFields || [], false, formRenderProps)}
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

                {/* Journal Lines Section */}
                <div className="form-section">
                  <div className="section-header">
                    <h3 className="section-title">Items</h3>
                  </div>
                  <div style={{ padding: '0', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                    <JournalLines
                      journalEntryId={id}
                      onLinesChange={handleJournalLinesChange}
                      mode={mode}
                      embedded={true}
                    />
                  </div>
                </div>
              </div>

              <div className="master-form-actions">
                <Button 
                  type="button" 
                  onClick={() => navigate(navigationPaths[recordType] || '/')}
                  className="k-button k-button-secondary"
                >
                  <FaTimes /> {mode === 'view' ? 'Close' : 'Cancel'}
                </Button>
                {mode !== 'new' && mode !== 'view' && (
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
                    disabled={loading || !formRenderProps.allowSubmit}
                    className="k-button k-button-primary"
                  >
                    <FaSave /> {loading ? 'Saving...' : 'Save'}
                  </Button>
                )}
              </div>
            </FormElement>
          )}
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


export const JournalEntryForm = (props) => <JournalForm {...props} recordType="JournalEntry" />;

export default JournalForm;
