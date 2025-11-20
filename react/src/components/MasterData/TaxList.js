import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Input } from '@progress/kendo-react-inputs';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import { FaPlus, FaSearch, FaSync, FaFilter } from 'react-icons/fa';
import { apiConfig, buildUrl } from '../../config/api';
import { STATUS_FILTER_OPTIONS, appendInactiveFilter } from '../../utils/statusFilters';

const TaxList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ results: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [statusFilter, setStatusFilter] = useState('All');

  // State for grid data and filtering/sorting
  const [gridData, setGridData] = useState({
    skip: 0,
    take: 10,
    sort: [
      { field: 'name', dir: 'asc' }
    ]
  });

  const fetchData = useCallback(async (
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All',
    sortField = null,
    sortDir = null
  ) => {
    try {
      setLoading(true);
      setError(null);

      let queryParams = `PageNumber=${pageNumber}&PageSize=${pageSize}`;

      if (search && search.trim() !== '') {
        queryParams += `&SearchText=${encodeURIComponent(search.trim())}`;
      }

      queryParams = appendInactiveFilter(status, queryParams);

      if (sortField && sortDir) {
        queryParams += `&SortBy=${encodeURIComponent(sortField)}&SortOrder=${sortDir === 'asc' ? 'asc' : 'desc'}`;
      }

      const url = buildUrl(`/tax?${queryParams}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch taxes: ${response.status}`);
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
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setGridData(prev => prev.skip === 0 ? prev : { ...prev, skip: 0 });
    const sortField = gridData.sort?.[0]?.field || null;
    const sortDir = gridData.sort?.[0]?.dir || null;
    fetchData(1, gridData.take, debouncedSearchText, statusFilter, sortField, sortDir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchText, statusFilter]);

  const dataStateChange = (e) => {
    const newDataState = e.dataState;
    setGridData(newDataState);

    const pageNumber = Math.floor(newDataState.skip / newDataState.take) + 1;
    const pageSize = newDataState.take;
    const sortField = newDataState.sort?.[0]?.field || null;
    const sortDir = newDataState.sort?.[0]?.dir || null;

    const oldSortField = gridData.sort?.[0]?.field || null;
    const oldSortDir = gridData.sort?.[0]?.dir || null;
    const sortChanged = sortField !== oldSortField || sortDir !== oldSortDir;

    if (pageNumber !== currentPage || pageSize !== gridData.take || sortChanged) {
      fetchData(pageNumber, pageSize, debouncedSearchText, statusFilter, sortField, sortDir);
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const getCurrentData = useCallback(() => {
    if (!data?.results) {
      return [];
    }
    return data.results;
  }, [data]);

  // Filter taxes based on search text
  const processedData = useCallback(() => {
    if (!data?.results) {
      return [];
    }

    return data.results;
  }, [data]);

  // Handle View button click
  const handleView = (id) => {
    navigate(`/tax/view/${id}`);
  };

  // Handle Edit button click
  const handleEdit = (id) => {
    navigate(`/tax/edit/${id}`);
  };

  const handleRefresh = () => {
    const pageNumber = Math.floor(gridData.skip / gridData.take) + 1;
    const pageSize = gridData.take;
    const sortField = gridData.sort?.[0]?.field || null;
    const sortDir = gridData.sort?.[0]?.dir || null;
    fetchData(pageNumber, pageSize, debouncedSearchText, statusFilter, sortField, sortDir);
    showNotification('Taxes refreshed successfully', 'success');
  };

  // Format tax rate as percentage
  const formatTaxRate = (rate) => {
    return `${Number(rate || 0).toFixed(2)}%`;
  };

  // Custom cell for tax rate display
  const TaxRateCell = (props) => {
    return (
      <td {...props.tdProps} style={{ textAlign: 'right' }}>
        {formatTaxRate(props.dataItem[props.field])}
      </td>
    );
  };

  const StatusCell = (props) => {
    const isInactive = props.dataItem.inactive;
    const statusText = isInactive ? 'Inactive' : 'Active';
    const badgeClass = isInactive ? 'status-inactive' : 'status-active';

    return (
      <td {...props.tdProps} style={{ textAlign: 'center' }}>
        <span className={`status-badge ${badgeClass}`}>{statusText}</span>
      </td>
    );
  };

  // Custom cell for action buttons
  const ActionCell = (props) => {
    const tax = props.dataItem;
    if (!tax || !tax.id) {
      return <td {...props.tdProps}>Invalid tax data</td>;
    }
    
    return (
      <td {...props.tdProps} className="k-command-cell">
        <div className="action-buttons">
          <Button
            onClick={() => handleView(tax.id)}
            className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-base"
          >
            View
          </Button>
          <Button
            onClick={() => handleEdit(tax.id)}
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

  if (loading) {
    return (
      <div className="k-p-4">
        <div className="tax-list-container">
          <div className="loading-indicator">
            <div className="spinner"></div>
            <div>Loading taxes...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="k-p-4">
        <div className="tax-list-container error-container">
          <div className="error-message">
            <div>Error loading taxes: {error}</div>
            <Button onClick={handleRefresh} className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary">
              <FaSync /> Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="k-p-4">
      <div className="tax-list-container">
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
          <h2>Tax Master</h2>
          <Button
            onClick={() => navigate('/tax/new')}
            className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
          >
            <FaPlus /> Add New Tax
          </Button>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <Input
              placeholder="Search taxes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="filter-bar">
            <FaFilter className="filter-icon" />
            <DropDownList
              data={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <Button
            onClick={handleRefresh}
            className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
            title="Refresh"
          >
            <FaSync />
          </Button>
        </div>

        {/* Grid or No Data Message */}
        {(!data?.results || data.results.length === 0) ? (
          <div className="no-data-message">
            <p>No taxes found. Click the "Add New Tax" button above to create your first tax.</p>
          </div>
        ) : processedData().length === 0 ? (
          <div className="no-data-message">
            <p>No taxes match your current search criteria. Try adjusting your filters.</p>
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
            <GridColumn title="No" width="70px" cell={SerialNumberCell} sortable={false} />
            <GridColumn field="name" title="Tax Name" width="300px" />
            <GridColumn field="taxRate" title="Tax Rate" width="150px" cell={TaxRateCell} sortable={false} />
            <GridColumn field="inactive" title="Status" width="140px" cell={StatusCell} sortable={false} />
            <GridColumn title="Actions" width="180px" cell={ActionCell} locked={true} lockable={false} sortable={false} />
          </Grid>
        )}

        <style>{`
          .tax-list-container {
            background: white;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 16px;
            margin: 16px;
          }

          .list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
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
            width: 180px;
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
          }

          .status-active {
            background-color: #C6F6D5;
            color: #2F855A;
          }

          .status-inactive {
            background-color: #FED7D7;
            color: #9B2C2C;
          }

          .k-grid {
            border-radius: 4px;
            border: 1px solid #E2E8F0;
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

          .k-grid-header th[data-title="Actions"] {
            text-align: center !important;
            padding: 4px !important;
          }

          .k-button {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 500;
            height: 28px;
            padding: 0 12px;
            border-radius: 3px;
            border: 1px solid transparent;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .action-buttons {
            display: flex;
            gap: 4px;
            justify-content: center;
          }

          .action-buttons .k-button {
            min-width: 50px;
            font-size: 11px;
            height: 24px;
            padding: 0 8px;
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

          .no-data-message {
            text-align: center;
            padding: 40px 20px;
            color: #718096;
            font-size: 14px;
          }

          .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
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

          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
            gap: 16px;
          }

          .error-message {
            text-align: center;
            color: #e53e3e;
            font-size: 14px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @media (max-width: 768px) {
            .tax-list-container {
              margin: 12px;
              padding: 12px;
            }

            .list-header {
              flex-direction: column;
              align-items: stretch;
              gap: 12px;
            }

            .filter-section {
              flex-direction: column;
              align-items: stretch;
              gap: 8px;
            }

            .search-bar {
              max-width: none;
            }

            .action-buttons {
              flex-direction: column;
              gap: 2px;
            }

            .action-buttons .k-button {
              font-size: 10px;
              padding: 2px 6px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TaxList; 
