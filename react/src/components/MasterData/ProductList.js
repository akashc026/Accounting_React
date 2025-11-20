import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Input } from '@progress/kendo-react-inputs';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Notification } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';
import { FaPlus, FaSearch, FaEye, FaPencilAlt, FaTrash, FaFilter, FaSync } from 'react-icons/fa';
import { apiConfig, buildUrl } from '../../config/api';
import { STATUS_FILTER_OPTIONS, appendInactiveFilter } from '../../utils/statusFilters';

const ProductList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ results: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('All');
  const [activeStatusFilter, setActiveStatusFilter] = useState('All');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Hardcoded item type mapping
  const itemTypeMapping = {
    "ef765a67-402b-48ee-b898-8eaa45affb64": "Inventory Item",
    "d89fbe6f-7421-4b41-becf-d94d2bcb6757": "Service Item"
  };

  // State for grid data and filtering/sorting
  const [gridData, setGridData] = useState({
    skip: 0,
    take: 10,
    sort: [
      { field: 'itemCode', dir: 'asc' }
    ]
  });

  // Debounce search text with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchText]);

  // Fetch products from API with pagination and filters
  const fetchData = useCallback(async (
    pageNumber = 1,
    pageSize = 10,
    search = '',
    itemType = 'All',
    activeStatus = 'All',
    sortField = null,
    sortDir = null
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      let queryParams = `PageNumber=${pageNumber}&PageSize=${pageSize}`;

      // Add search parameter if provided
      if (search && search.trim() !== '') {
        const encodedSearch = encodeURIComponent(search.trim());
        queryParams += `&SearchText=${encodedSearch}&search=${encodedSearch}`;
      }

      // Add item type filter if not 'All'
      if (itemType !== 'All') {
        // Map display name to GUID
        const itemTypeGuid = Object.keys(itemTypeMapping).find(
          key => itemTypeMapping[key] === itemType
        );
        if (itemTypeGuid) {
          queryParams += `&itemType=${encodeURIComponent(itemTypeGuid)}`;
        }
      }

      // Add active status filter if not 'All'
      queryParams = appendInactiveFilter(activeStatus, queryParams);

      if (sortField && sortDir) {
        queryParams += `&SortBy=${encodeURIComponent(sortField)}&SortOrder=${sortDir === 'asc' ? 'asc' : 'desc'}`;
      }

      const url = buildUrl(`/product?${queryParams}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
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
  }, [itemTypeMapping]);

  // Initial data load
  useEffect(() => {
    const sortField = gridData.sort?.[0]?.field || null;
    const sortDir = gridData.sort?.[0]?.dir || null;
    fetchData(1, gridData.take, debouncedSearchText, itemTypeFilter, activeStatusFilter, sortField, sortDir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger search when debounced search text or filters change
  useEffect(() => {
    // Reset to first page when search or filters change
    setGridData(prev => prev.skip === 0 ? prev : ({ ...prev, skip: 0 }));
    const sortField = gridData.sort?.[0]?.field || null;
    const sortDir = gridData.sort?.[0]?.dir || null;
    fetchData(1, gridData.take, debouncedSearchText, itemTypeFilter, activeStatusFilter, sortField, sortDir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchText, itemTypeFilter, activeStatusFilter]);

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
      fetchData(pageNumber, pageSize, debouncedSearchText, itemTypeFilter, activeStatusFilter, sortField, sortDir);
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

  // Return data directly from server (filtering is now server-side)
  const processedData = useCallback(() => {
    if (!data?.results) {
      return [];
    }
    return data.results;
  }, [data]);

  // Handle View button click
  const handleView = (id) => {
    navigate(`/product/view/${id}`);
  };

  // Handle Edit button click
  const handleEdit = (id) => {
    navigate(`/product/edit/${id}`);
  };

  const handleRefresh = () => {
    const pageNumber = Math.floor(gridData.skip / gridData.take) + 1;
    const pageSize = gridData.take;
    const sortField = gridData.sort?.[0]?.field || null;
    const sortDir = gridData.sort?.[0]?.dir || null;
    fetchData(pageNumber, pageSize, debouncedSearchText, itemTypeFilter, activeStatusFilter, sortField, sortDir);
    showNotification('Products refreshed successfully', 'success');
  };

  // Custom cell for item type with colored badges
  const ItemTypeCell = (props) => {
    const itemTypeId = props.dataItem.itemType;
    const itemTypeName = itemTypeMapping[itemTypeId] || 'Unknown';
    const badgeClass = itemTypeName === 'Service Item' ? 'itemtype-service' : 'itemtype-inventory';

    return (
      <td {...props.tdProps} style={{ textAlign: 'center' }}>
        <span className={`itemtype-badge ${badgeClass}`}>{itemTypeName}</span>
      </td>
    );
  };

  // Custom cell for active/inactive status with colored badges
  const ActiveStatusCell = (props) => {
    const isActive = props.dataItem.inactive;
    const statusText = isActive ? 'Inactive' : 'Active';
    const badgeClass = isActive ? 'status-inactive' : 'status-active' ;

    return (
      <td {...props.tdProps} style={{ textAlign: 'center' }}>
        <span className={`status-badge ${badgeClass}`}>{statusText}</span>
      </td>
    );
  };

  // Custom cell for action buttons  
  const ActionCell = (props) => {
    const product = props.dataItem;
    if (!product || !product.id) {
      return <td {...props.tdProps}>Invalid product data</td>;
    }
    
    return (
      <td {...props.tdProps} className="k-command-cell">
        <div className="action-buttons">
          <Button
            onClick={() => handleView(product.id)}
            className="k-button k-button-sm k-rounded-sm k-button-solid k-button-solid-base"
          >
            View
          </Button>
          <Button
            onClick={() => handleEdit(product.id)}
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
        <div className="product-list-container">
          <div className="loading-indicator">
            <div className="spinner"></div>
            <div>Loading products...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="k-p-4">
        <div className="product-list-container error-container">
          <div className="error-message">
            <div>Error loading products: {error}</div>
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
      <div className="product-list-container">
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
          <h2>Product Master</h2>
          <Button
            onClick={() => navigate('/product/new')}
            className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
          >
            <FaPlus /> Add New Product
          </Button>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <Input
              placeholder="Search products..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="filter-bar">
            <FaFilter className="filter-icon" />
            <DropDownList
              data={['All', 'Service Item', 'Inventory Item']}
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="filter-bar">
            <FaFilter className="filter-icon" />
            <DropDownList
              data={STATUS_FILTER_OPTIONS}
              value={activeStatusFilter}
              onChange={(e) => setActiveStatusFilter(e.target.value)}
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
            <p>No products found. Click the "Add New Product" button above to create your first product.</p>
          </div>
        ) : processedData().length === 0 ? (
          <div className="no-data-message">
            <p>No products match your current search criteria. Try adjusting your filters.</p>
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
            <GridColumn field="itemCode" title="Item Code" width="150px" />
            <GridColumn field="itemName" title="Item Name" width="200px" />
            <GridColumn field="itemType" title="Item Type" width="170px" cell={ItemTypeCell} sortable={false} />
            <GridColumn field="inactive" title="Status" width="140px" cell={ActiveStatusCell} sortable={false} />
            <GridColumn title="Actions" width="180px" cell={ActionCell} locked={true} lockable={false} sortable={false} />
          </Grid>
        )}
      </div>

      <style>{`
        .product-list-container {
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

        .no-data-message {
          text-align: center;
          padding: 40px 20px;
          color: #718096;
          font-size: 14px;
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

        .itemtype-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          min-width: 100px;
        }

        .itemtype-service {
          background-color: #DBEAFE;
          color: #1E40AF;
        }

        .itemtype-inventory {
          background-color: #D1FAE5;
          color: #059669;
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
          background-color: #D1FAE5;
          color: #065F46;
        }

        .status-inactive {
          background-color: #FEE2E2;
          color: #991B1B;
        }

        /* Additional grid alignment fixes */
        .product-grid .k-table {
          table-layout: fixed;
          width: 100%;
        }

        .product-grid .k-table-thead .k-table-th {
          padding: 12px 8px;
          border-right: 1px solid #e2e8f0;
          vertical-align: middle;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-grid .k-table-tbody .k-table-td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Ensure item name column can wrap if needed */
        .product-grid .k-table-tbody .k-table-td:nth-child(3) {
          white-space: normal;
          word-wrap: break-word;
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
          .product-list-container {
            margin: 12px;
            padding: 12px;
          }

          .list-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .filter-section {
            padding: 8px;
          }

          .filter-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .filter-item {
            flex-direction: column;
            align-items: stretch;
            gap: 4px;
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
  );
};

export default ProductList; 
