import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Input } from '@progress/kendo-react-inputs';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import { FaPlus, FaSearch, FaSync } from 'react-icons/fa';
import { buildUrl } from '../../config/api';

const JournalEntryList = () => {
  const navigate = useNavigate();
  
  const [data, setData] = useState({ results: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchText, setSearchText] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [debouncedSearchText, setDebouncedSearchText] = useState('');

  // State for grid data and filtering/sorting
  const [gridData, setGridData] = useState({
    skip: 0,
    take: 10,
    sort: [
      { field: 'sequenceNumber', dir: 'desc' }
    ]
  });

  // Fetch journal entries with pagination
  const fetchJournalEntries = useCallback(async (
    pageNumber = 1,
    pageSize = 10,
    search = '',
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

      if (sortField && sortDir) {
        queryParams += `&SortBy=${encodeURIComponent(sortField)}&SortOrder=${sortDir === 'asc' ? 'asc' : 'desc'}`;
      }

      const url = buildUrl(`/journal-entry?${queryParams}`);
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch journal entries: ${response.status}`);
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

  // Handle grid data state changes (sorting, filtering, paging)
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
      fetchJournalEntries(pageNumber, pageSize, debouncedSearchText, sortField, sortDir);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Refetch when debounced search text changes
  useEffect(() => {
    setGridData(prev => {
      const updated = prev.skip === 0 ? prev : { ...prev, skip: 0 };
      const sortField = prev.sort?.[0]?.field || null;
      const sortDir = prev.sort?.[0]?.dir || null;
      fetchJournalEntries(1, prev.take, debouncedSearchText, sortField, sortDir);
      return updated;
    });
  }, [debouncedSearchText, fetchJournalEntries]);

  // Handle refresh
  const refresh = () => {
    const pageNumber = Math.floor(gridData.skip / gridData.take) + 1;
    const pageSize = gridData.take;
    const sortField = gridData.sort?.[0]?.field || null;
    const sortDir = gridData.sort?.[0]?.dir || null;
    fetchJournalEntries(pageNumber, pageSize, debouncedSearchText, sortField, sortDir);
    showNotification('Journal entries refreshed successfully');
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

  // Filter and process journal entries data for the Grid
  const processedData = useCallback(() => {
    if (!data?.results) {
      return [];
    }

    return data.results;
  }, [data]);

  // Handle View button click
  const handleView = (id) => {
    navigate(`/journal-entry/view/${id}`);
  };

  // Handle Edit button click
  const handleEdit = (id) => {
    navigate(`/journal-entry/edit/${id}`);
  };

  // Custom cell for date display
  const DateCell = (props) => {
    return (
      <td {...props.tdProps}>
        {formatDate(props.dataItem[props.field])}
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

  // Custom cell for status with badge styling
  const StatusCell = (props) => {
    const status = props.dataItem.statusName || 'Draft';
    const badgeClass = status.toLowerCase() === 'posted' ? 'status-posted' : 'status-draft';

    return (
      <td {...props.tdProps} style={{ textAlign: 'center' }}>
        <span className={`status-badge ${badgeClass}`}>{status}</span>
      </td>
    );
  };

  // Custom cell for action buttons
  const ActionCell = (props) => {
    const entry = props.dataItem;
    if (!entry || !entry.id) {
      return <td {...props.tdProps}>Invalid entry data</td>;
    }
    
    return (
      <td {...props.tdProps} className="k-command-cell">
        <div className="action-buttons">
          <Button
            onClick={() => handleView(entry.id)}
            className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-base"
          >
            View
          </Button>
          <Button
            onClick={() => handleEdit(entry.id)}
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
        <div className="journal-entry-list-container">
          <div className="loading-indicator">
            <div className="spinner"></div>
            <div>Loading journal entries...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="k-p-4">
        <div className="journal-entry-list-container error-container">
          <div className="error-message">
            <div>Error loading journal entries: {error}</div>
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
      <div className="journal-entry-list-container">
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
          <h2>Journal Entry Master</h2>
          <Button
            onClick={() => navigate('/journal-entry/new')}
            className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
          >
            <FaPlus /> Add New Journal Entry
          </Button>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <Input
              placeholder="Search journal entries..."
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
            <p>No journal entries found. Click the "Add New Journal Entry" button above to create your first journal entry.</p>
          </div>
        ) : processedData().length === 0 ? (
          <div className="no-data-message">
            <p>No journal entries match your current search criteria. Try adjusting your filters.</p>
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
            <GridColumn field="sequenceNumber" title="Sequence Number" width="180px" />
            <GridColumn field="tranDate" title="Transaction Date" width="150px" cell={DateCell} sortable={false} />
            <GridColumn title="Actions" width="180px" cell={ActionCell} locked={true} lockable={false} sortable={false} />
          </Grid>
        )}

        <style>{`
          .journal-entry-list-container {
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

          .status-posted {
            background-color: #C6F6D5;
            color: #2F855A;
          }

          .status-cancelled {
            background-color: #FED7D7;
            color: #9B2C2C;
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
            .journal-entry-list-container {
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

export default JournalEntryList;
