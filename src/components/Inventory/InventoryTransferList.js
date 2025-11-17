import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { useCustomers } from '../../hooks/useMasterData';
import { Input } from '@progress/kendo-react-inputs';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import { FaPlus, FaSearch, FaEye, FaPencilAlt, FaTrash, FaFilter, FaSync } from 'react-icons/fa';
import { apiConfig, buildUrl } from '../../config/api';

const InventoryTransferList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ results: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { customers } = useCustomers();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // State for grid data and filtering/sorting
  const [gridData, setGridData] = useState({
    skip: 0,
    take: 10,
    sort: [
      { field: 'transferDate', dir: 'desc' }
    ]
  });

  // Fetch inventory transfers with pagination
  const fetchData = useCallback(async (pageNumber = 1, pageSize = 10) => {
    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(`/inventory-transfer?PageNumber=${pageNumber}&PageSize=${pageSize}`);
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch inventory transfers: ${response.status}`);
      }

      const responseData = await response.json();

      if (Array.isArray(responseData)) {
        setData({ results: responseData });
        setTotalItems(responseData.length);
      } else if (responseData.results && Array.isArray(responseData.results)) {
        setData(responseData);
        setTotalItems(responseData.totalItems || responseData.totalCount || responseData.total || responseData.results.length);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setData({ results: responseData.data });
        setTotalItems(responseData.totalItems || responseData.totalCount || responseData.total || responseData.data.length);
      } else {
        setData({ results: [] });
        setTotalItems(0);
      }

      setCurrentPage(pageNumber);
    } catch (err) {
      setError(err.message);
      setData({ results: [] });
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Handle grid data state changes (sorting, filtering, paging)
  const dataStateChange = (e) => {
    const newDataState = e.dataState;
    setGridData(newDataState);

    const pageNumber = Math.floor(newDataState.skip / newDataState.take) + 1;
    const pageSize = newDataState.take;

    if (pageNumber !== currentPage || pageSize !== gridData.take) {
      fetchData(pageNumber, pageSize);
    }
  };

  const getCurrentData = useCallback(() => {
    if (!data?.results) {
      return [];
    }
    return data.results;
  }, [data]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Get customer name - use from data if available, otherwise lookup
  const getCustomerName = (transfer) => {
    // API already includes customerName, use it directly
    if (transfer.customerName) {
      return transfer.customerName;
    }
    // Fallback to lookup if customerName not in response
    const customer = customers?.results?.find(c => c.id === transfer.customerID);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Format date as string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format amount without currency symbol
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Filter and process inventory transfers data for the Grid
  const processedData = useCallback(() => {
    if (!data?.results) {
      return [];
    }

    let filteredData = [...data.results];

    // Apply search filter
    if (searchText) {
      filteredData = filteredData.filter(transfer => {
        const customerName = getCustomerName(transfer);
        const searchString = `${transfer.sequenceNumber || ''} ${customerName} ${transfer.status || ''}`.toLowerCase();
        return searchString.includes(searchText.toLowerCase());
      });
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filteredData = filteredData.filter(transfer => transfer.status === statusFilter);
    }

    return filteredData;
  }, [data, searchText, statusFilter, customers]);

  // Handle View button click
  const handleView = (id) => {
    navigate(`/inventory-transfer/view/${id}`);
  };

  // Handle Edit button click
  const handleEdit = (id) => {
    navigate(`/inventory-transfer/edit/${id}`);
  };

  // Custom cell for date display
  const DateCell = (props) => {
    return (
      <td {...props.tdProps}>
        {formatDate(props.dataItem[props.field])}
      </td>
    );
  };

  // Custom cell for customer display
  const CustomerCell = (props) => {
    return (
      <td {...props.tdProps}>
        {getCustomerName(props.dataItem)}
      </td>
    );
  };

  // Custom cell for amount display
  const AmountCell = (props) => {
    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        {formatAmount(props.dataItem[props.field])}
      </td>
    );
  };

  // Custom cell for status with hardcoded "Open" status
  const StatusCell = (props) => {
    const status = 'Open'; // Hardcoded to "Open"
    const badgeClass = 'status-open'; // Use open status class

    return (
      <td {...props.tdProps} style={{ textAlign: 'center' }}>
        <span className={`status-badge ${badgeClass}`}>{status}</span>
      </td>
    );
  };

  // Custom cell for action buttons
  const ActionCell = (props) => {
    const transfer = props.dataItem;
    if (!transfer || !transfer.id) {
      return <td {...props.tdProps}>Invalid transfer data</td>;
    }
    
    return (
      <td {...props.tdProps} className="k-command-cell">
        <div className="action-buttons">
        <Button
            onClick={() => handleView(transfer.id)}
            className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-base"
        >
          View
        </Button>
        <Button
            onClick={() => handleEdit(transfer.id)}
            className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-primary"
        >
          Edit
        </Button>
        </div>
      </td>
    );
  };

  const SerialNumberCell = (props) => {
    const currentPageData = getCurrentData();
    const rowIndexInPage = currentPageData.findIndex(item => item === props.dataItem);
    const pageSize = gridData.take || 10;
    const page = currentPage || 1;
    const index = ((page - 1) * pageSize) + rowIndexInPage + 1;
    return (
      <td {...props.tdProps} style={{ textAlign: 'center' }}>
        {index}
      </td>
    );
  };

  // Handle refresh
  const refresh = () => {
    const pageNumber = Math.floor(gridData.skip / gridData.take) + 1;
    const pageSize = gridData.take;
    fetchData(pageNumber, pageSize);
    showNotification('Inventory transfers refreshed successfully');
  };

  if (loading) {
    return (
      <div className="k-p-4">
        <div className="inventory-transfer-list-container">
          <div className="loading-indicator">
            <div className="spinner"></div>
            <div>Loading inventory transfers...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="k-p-4">
        <div className="inventory-transfer-list-container error-container">
          <div className="error-message">
            <div>Error loading inventory transfers: {error}</div>
            <Button onClick={refresh} className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary">
              <FaSync /> Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="k-p-4">
      <div className="inventory-transfer-list-container">
        {/* Notification */}
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

        {/* Header Section */}
        <div className="list-header">
          <h2>Inventory Transfer Master</h2>
        <Button
          onClick={() => navigate('/inventory-transfer/new')}
          className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
          >
            <FaPlus /> Add New Inventory Transfer
          </Button>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <Input
              placeholder="Search inventory transfers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Button
            onClick={refresh}
            className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
            title="Refresh"
          >
            <FaSync />
        </Button>
      </div>

        {/* Grid or No Data Message */}
        {(!data?.results || data.results.length === 0) ? (
          <div className="no-data-message">
            <p>No inventory transfers found. Click the "Add New Inventory Transfer" button above to create your first inventory transfer.</p>
          </div>
        ) : processedData().length === 0 ? (
          <div className="no-data-message">
            <p>No inventory transfers match your current search criteria. Try adjusting your filters.</p>
          </div>
        ) : (
      <Grid
            data={processedData()}
            pageable={{
              pageSizes: [10, 20, 50],
              buttonCount: 5,
              info: true
            }}
        sortable={true}
            {...gridData}
        onDataStateChange={dataStateChange}
            total={totalItems}
        style={{
              height: 'calc(100vh - 250px)',
              minHeight: '400px'
        }}
      >
            <GridColumn title="No" width="70px" cell={SerialNumberCell} />
            <GridColumn field="sequenceNumber" title="Sequence Number" width="180px" />
            <GridColumn field="customerID" title="Customer" width="200px" cell={CustomerCell} />
            <GridColumn title="Actions" width="180px" cell={ActionCell} locked={true} lockable={false} />
      </Grid>
        )}

      <style>{`
          .inventory-transfer-list-container {
            background: white;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 16px;
            margin: 12px;
          }

          .list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .k-dropdown-wrap {
            background: transparent;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
          }

          .k-dropdown-wrap .k-input {
            background: transparent;
            padding-left: 28px;
          }

          .list-header h2 {
            margin: 0;
            color: #2d3748;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .filter-section {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
            align-items: center;
          }

          .search-bar {
            flex: 1;
            position: relative;
            max-width: 400px;
          }

          .search-icon {
            position: absolute;
            left: 8px;
            top: 50%;
            transform: translateY(-50%);
            color: #718096;
            font-size: 13px;
          }

          .search-bar .k-input {
            padding-left: 28px;
            font-size: 13px;
            height: 32px;
          }

          .filter-bar {
            position: relative;
            width: 150px;
          }

          .filter-icon {
            position: absolute;
            left: 8px;
            top: 50%;
            transform: translateY(-50%);
            color: #718096;
            font-size: 13px;
            z-index: 1;
          }

          .filter-bar .k-dropdown {
            width: 100%;
          }

          .filter-bar .k-input-inner {
            padding-left: 28px;
            font-size: 13px;
            height: 32px;
          }

        .status-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            min-width: 80px;
            max-width: none;
            white-space: nowrap;
            text-overflow: clip;
            overflow: visible;
            width: auto;
          }

          .status-draft {
            background-color: #FEF3C7;
            color: #92400E;
          }

          .status-transferred {
            background-color: #C6F6D5;
            color: #2F855A;
          }

          .status-cancelled {
            background-color: #FED7D7;
            color: #9B2C2C;
          }

          .status-open {
            background-color: #E6FFFA;
            color: #00695C;
          }

          .k-grid {
            border-radius: 4px;
            border: 1px solid #E2E8F0;
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
          }

          .k-grid .k-grid-container {
            max-width: 100%;
          }

          .k-grid-header {
            background-color: #F7FAFC;
          }

          .k-grid-header th {
            font-weight: 600;
            color: #4A5568;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.05em;
            padding: 8px;
          }

          .k-grid td {
            border-color: #E2E8F0;
            padding: 8px;
            font-size: 13px;
          }

          .k-command-cell {
            padding: 4px !important;
            text-align: center !important;
          }

          .k-button {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: 500;
            height: 32px;
          }

          .k-button svg {
            font-size: 13px;
          }

          .k-command-cell .k-button {
          padding: 4px 8px;
            height: 24px;
            min-width: 60px;
            font-size: 12px;
          }

          .notification-container {
            position: fixed;
            right: 12px;
            top: 12px;
            z-index: 9999;
            min-width: 280px;
          }

          .k-notification {
            font-size: 13px;
            padding: 8px 12px;
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

          .error-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 150px;
          }

          .error-message {
            text-align: center;
            color: #e53e3e;
            font-size: 14px;
          }

          .error-message button {
            margin-top: 12px;
          }

          .no-data-message {
            text-align: center;
            padding: 40px 20px;
            color: #718096;
            font-size: 14px;
            background-color: #f7fafc;
          border-radius: 4px;
            border: 1px solid #e2e8f0;
          }

          .no-data-message p {
            margin: 0;
          }

          .action-buttons {
            display: flex;
            gap: 4px;
            justify-content: center;
          }

          .action-buttons .k-button {
            padding: 2px 6px;
            height: 22px;
            min-width: 50px;
            font-size: 11px;
            line-height: 1;
        }

          @media (max-width: 768px) {
            .inventory-transfer-list-container {
              margin: 8px;
              padding: 12px;
            }

            .filter-section {
              flex-direction: column;
              align-items: stretch;
              gap: 8px;
        }

            .search-bar {
              max-width: none;
            }

            .filter-bar {
              width: 100%;
            }
          }

          .k-grid-header th[data-title="No"] {
            text-align: center;
          }

          .k-grid-header th[data-title="Actions"] {
            text-align: center !important;
            padding: 4px !important;
        }

          .k-grid td:nth-child(4) {
            overflow: visible !important;
            text-overflow: clip !important;
          }

          .k-grid .k-table-td {
            text-overflow: initial !important;
          }

          .k-grid .k-table-td .status-badge {
            max-width: none !important;
            overflow: visible !important;
        }
      `}</style>
      </div>
    </div>
  );
};

export default InventoryTransferList;
