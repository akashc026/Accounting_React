import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiConfig, buildUrl } from '../../config/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Field, FormElement, FieldArray } from '@progress/kendo-react-form';
import { Input, TextArea, NumericTextBox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { clone } from '@progress/kendo-react-common';
import { FaSave, FaTimes, FaPlus, FaTrash, FaEdit, FaCheck, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';
import '../../shared/styles/DynamicFormCSS.css';

// Create React Context for editing
const ItemGridEditContext = React.createContext({});
const ITEM_DATA_INDEX = 'itemDataIndex';
const DATA_ITEM_KEY = 'id';

const JournalLines = React.memo(({ recordType = 'JournalEntry', mode = 'new', embedded = false, selectedLocation, jeid = null, jeidChangeCounter = 0, onLinesChange, journalEntryId }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [dropdownData, setDropdownData] = useState({});
  const [formInitialized, setFormInitialized] = useState(false);

  // Journal Entry navigation
  const navigationPaths = {
    JournalEntry: '/journal-entry'
  };

  // Get journal-specific item configurations
  const getItemConfiguration = useCallback((transactionType) => {
    switch (transactionType) {
      case 'JournalEntry':
        return {
          title: 'Journal Lines',
          fields: ['accountID', 'debit', 'credit', 'memo']
        };
      default:
        return {
          title: 'Journal Lines',
          fields: ['accountID', 'debit', 'credit', 'memo']
        };
    }
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  }, []);

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

  const loadTransactionItems = useCallback(async (transactionId) => {
    // Define API endpoints for loading line items based on transaction type
    const transactionConfig = {
      JournalEntry: {
        endpoint: `${apiConfig.baseURL}/journal-entry-line/by-journal-entry/${transactionId}`,
        idField: 'jeid'
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
      const items = data.lines || data || [];
      console.log("items",items)

      // Transform API data to match form structure
      return items.map((item, index) => ({
        id: item.id || `temp-${index}`, // Add id field for grid dataItemKey
        accountID: item.account || '',
        debit: item.debit || 0,
        credit: item.credit || 0,
        memo: item.memo || ''
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

        // Fetch dropdown data for required fields (chart of accounts)
        const dropdownPromises = [
          fetchDropdownData('/chart-of-account').then(data => ({ name: 'accountID', data }))
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
        
        // If in edit mode, load existing transaction items
        const transactionId = journalEntryId || id;
        if (mode !== 'new' && transactionId) {
          try {
            const existingItems = await loadTransactionItems(transactionId);
            console.log("existingItems",existingItems)
            if (existingItems && existingItems.length > 0) {
              initialFormData.items = existingItems;
            }
          } catch (err) {
            // Continue with empty items array if loading fails
          }
        }

        if (!isMounted) return;
        console.log('🔧 JournalLines: Setting form data:', initialFormData);
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

  // Notify parent form when lines change (for embedded mode)
  useEffect(() => {
    console.log('🔍 JournalLines useEffect check:', { 
      embedded, 
      hasOnLinesChange: !!onLinesChange, 
      hasItems: !!formData.items, 
      itemsLength: formData.items?.length || 0,
      formInitialized 
    });
    
    if (embedded && onLinesChange && formData.items && formInitialized) {
      console.log('📞 JournalLines: Notifying parent form of line changes:', formData.items);
      onLinesChange(formData.items);
    }
  }, [formData.items, onLinesChange, formInitialized, embedded]);

  // No amount calculations needed as requested

  const handleSubmit = async (formValues) => {
   
  };

  const getDropdownProps = useCallback((fieldName) => {
    const options = dropdownData[fieldName] || [];

    const transformedOptions = options.map(item => {
      if (typeof item === 'string') return { text: item, value: item };
      if (!item.id) return { text: String(item), value: item };

      const getDisplayText = (obj) => {
        // Handle special cases with formatted text for accounts
        if (fieldName === 'accountID' && obj.accountName && obj.accountCode) {
          return `${obj.accountCode} - ${obj.accountName}`;
        }

        // Priority fields for display
        const displayFields = ['name', 'accountName', 'description', 'title'];
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

  // Grid cell components for journal lines
  const AccountCell = (props) => {
    const { parentField, editIndex, validatedItems, onUpdateField } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;
    const shouldValidate = validatedItems.includes(props.dataItem[ITEM_DATA_INDEX]);

    if (isInEdit) {
      const accountOptions = getDropdownProps('accountID');

      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <DropDownList
            data={accountOptions}
            textField="text"
            dataItemKey="value"
            valueField="value"
            value={accountOptions.find(p => p.value === props.dataItem[props.field]) || null}
            onChange={async (e) => {
              const selectedValue = e.target.value?.value || e.target.value;
              await onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, selectedValue);
            }}
            style={{ width: '100%' }}
          />
        </td>
      );
    }

    const fieldValue = props.dataItem[props.field];
    const accountOptions = getDropdownProps('accountID');
    const account = accountOptions.find(p => p.value === fieldValue);
    const accountName = account?.text || '';

    return (
      <td {...props.tdProps}>
        <span style={{ padding: '8px', display: 'block' }}>
          {accountName}
        </span>
      </td>
    );
  };

  const DebitCell = (props) => {
    const { parentField, editIndex, onUpdateField } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;

    if (isInEdit) {
      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={props.dataItem[props.field] ?? ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              const newValue = inputValue === '' ? '' : parseFloat(inputValue) || '';
              onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, newValue);
            }}
            style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '13px' }}
          />
        </td>
      );
    }

    const value = props.dataItem[props.field];
    const formattedValue = value !== null && value !== undefined && typeof value === 'number' ?
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
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

  const CreditCell = (props) => {
    const { parentField, editIndex, onUpdateField } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;

    if (isInEdit) {
      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={props.dataItem[props.field] ?? ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              const newValue = inputValue === '' ? '' : parseFloat(inputValue) || '';
              onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, newValue);
            }}
            style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '13px' }}
          />
        </td>
      );
    }

    const value = props.dataItem[props.field];
    const formattedValue = value !== null && value !== undefined && typeof value === 'number' ?
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
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

  const MemoCell = (props) => {
    const { parentField, editIndex, onUpdateField } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;

    if (isInEdit) {
      return (
        <td {...props.tdProps} style={{ padding: '0' }}>
          <Input
            value={props.dataItem[props.field] ?? ''}
            onChange={(e) => {
              onUpdateField(props.dataItem[ITEM_DATA_INDEX], props.field, e.target.value);
            }}
            style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '13px' }}
          />
        </td>
      );
    }

    return (
      <td {...props.tdProps}>
        <span style={{ padding: '8px', display: 'block' }}>
          {props.dataItem[props.field] || ''}
        </span>
      </td>
    );
  };

  const CommandCell = (props) => {
    const { onRemove, onEdit, onSave, onCancel, editIndex, validateItem } = React.useContext(ItemGridEditContext);
    const isInEdit = props.dataItem[ITEM_DATA_INDEX] === editIndex;
    const isNewItem = !props.dataItem[DATA_ITEM_KEY] ||
      (!props.dataItem.accountID);

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

  // Journal Lines Grid Component
  const JournalLinesGrid = (fieldArrayRenderProps) => {
    const { validationMessage, visited, name, dataItemKey } = fieldArrayRenderProps;
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
        const isValid = item.accountID && item.accountID !== null;

        return isValid;
      }
      return false;
    }, [fieldArrayRenderProps.value]);

    const onUpdateField = useCallback(async (index, fieldName, value) => {
      const currentItem = fieldArrayRenderProps.value[index];
      const updatedItem = {
        ...currentItem,
        [fieldName]: value
      };

      // Clear credit if debit is entered and vice versa (journal entry rule)
      if (fieldName === 'debit' && value > 0) {
        updatedItem.credit = 0;
      } else if (fieldName === 'credit' && value > 0) {
        updatedItem.debit = 0;
      }

      fieldArrayRenderProps.onReplace({
        index: index,
        value: updatedItem
      });
    }, [fieldArrayRenderProps]);

    // No calculations needed - removed as requested

    // Add a new item
    const onAdd = useCallback((e) => {
      e.preventDefault();

      if (editIndex !== undefined || mode === 'view') {
        return;
      }

      // Check for existing empty items and edit them instead
      const currentItems = fieldArrayRenderProps.value || [];
      const emptyItemIndex = currentItems.findIndex(item => !item.accountID);
      if (emptyItemIndex !== -1) {
        setEditIndex(emptyItemIndex);
        return;
      }

      const newItemId = currentItems.length > 0
        ? Math.max(...currentItems.map(item => parseInt(item.id) || 0)) + 1
        : 1;

      // Create new journal line
      const newItem = {
        id: newItemId,
        accountID: '',
        debit: 0,
        credit: 0,
        memo: ''
      };

      fieldArrayRenderProps.onUnshift({ value: newItem });
      setEditIndex(0);
    }, [fieldArrayRenderProps, editIndex, mode]);

    const onRemove = useCallback((dataItem) => {
      fieldArrayRenderProps.onRemove({
        index: dataItem[ITEM_DATA_INDEX]
      });
      setEditIndex(undefined);
      editItemCloneRef.current = undefined;
    }, [fieldArrayRenderProps]);

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
    }, [fieldArrayRenderProps]);

    const onSave = useCallback((dataItem) => {
      const index = dataItem[ITEM_DATA_INDEX];
      const currentItem = fieldArrayRenderProps.value[index];

      // Basic validation
      if (!currentItem.accountID) {
        alert('Account is required');
        return;
      }

      if ((!currentItem.debit || currentItem.debit <= 0) && (!currentItem.credit || currentItem.credit <= 0)) {
        alert('Either debit or credit amount must be greater than 0');
        return;
      }

      if ((currentItem.debit > 0) && (currentItem.credit > 0)) {
        alert('A line cannot have both debit and credit amounts');
        return;
      }

      setEditIndex(undefined);
      editItemCloneRef.current = undefined;
    }, [fieldArrayRenderProps]);

    const dataWithIndexes = (fieldArrayRenderProps.value || []).map((item, index) => {
      return {
        ...item,
        [ITEM_DATA_INDEX]: index
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
        validateItem
      }}>



        {mode !== 'view' && (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingLeft: '8px', paddingRight: '8px' }}>
            <Button
              onClick={onAdd}
              themeColor="success"
              fillMode="solid"
              size="medium"
              className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success"
            >
              <FaPlus style={{ marginRight: '6px' }} /> Add Line
            </Button>
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
            dataItemKey={dataItemKey}
            rowRender={rowRender}
            style={{ minWidth: '900px' }}
          >
            <GridColumn field="accountID" title="Account" cells={{ data: AccountCell }} />
            <GridColumn field="debit" title="Debit" width="90px" cells={{ data: DebitCell }} />
            <GridColumn field="credit" title="Credit" width="90px" cells={{ data: CreditCell }} />
            <GridColumn field="memo" title="Memo" cells={{ data: MemoCell }} />
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
        if (!item.accountID) {
          itemError.accountID = 'Account is required';
        }
        if ((!item.debit || item.debit <= 0) && (!item.credit || item.credit <= 0)) {
          itemError.debit = 'Either debit or credit amount must be greater than 0';
        }
        if ((item.debit > 0) && (item.credit > 0)) {
          itemError.debit = 'A line cannot have both debit and credit amounts';
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

  // If embedded, return just the grid component to integrate with parent form
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

        <FieldArray
          name="items"
          component={JournalLinesGrid}
          dataItemKey={DATA_ITEM_KEY}
          validator={(value) => value && value.length ? '' : 'Please add at least one item'}
        />
      </div>
    );
  }

  return (
    <>
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

      <Form
        key={`${recordType.toLowerCase()}-lines-form-${mode}-${id || 'new'}`}
        initialValues={formData}
        validator={validator}
        onSubmit={handleSubmit}
        render={(formRenderProps) => (
          <>
            <FieldArray
              name="items"
              component={JournalLinesGrid}
              dataItemKey={DATA_ITEM_KEY}
              validator={(value) => value && value.length ? '' : 'Please add at least one item'}
            />

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
          </>
        )}
      />

      <style>{`
        .form-container {
          background: white;
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
          overflow-x: auto !important;
          overflow-y: visible !important;
          margin-bottom: 16px;
          width: 100% !important;
          max-width: 100% !important;
          -webkit-overflow-scrolling: touch;
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
          min-width: 900px !important;
          width: auto !important;
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
            overflow-x: auto;
            overflow-y: visible;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e0 #f7fafc;
          }

          .transaction-items-grid .k-grid-table {
            min-width: 700px;
          }
        }
      `}</style>
    </>
  );
});

export default JournalLines;