import React, { useState, useEffect } from 'react';
import { TreeList } from '@progress/kendo-react-treelist';
import { Card, CardHeader, CardBody } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { buildUrl } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';

const ChartOfAccountList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Convert API response to tree structure function
  const convertApiDataToTreeStructure = (apiResults) => {
    console.log('Converting API data:', apiResults);

    // Create a map to store all items by their ID for quick lookup
    const itemMap = new Map();

    // First pass: Create all items and add them to the map
    apiResults.forEach(item => {
      const treeItem = {
        id: item.id,
        accountName: item.name,
        isParent: item.isParent,
        parent: item.parent, // This is the parent ID
        parentName: item.parentName,
        parentId: item.parent,
        expanded: false, // All items start collapsed
        accountNumber: item.accountNumber,
        accountType: item.accountTypeName || 'Unknown',
        openingBalance: item.openingBalance,
        runningBalance: item.runningBalance,
        inactive: item.inactive,
        notes: item.notes,
        items: []
      };
      itemMap.set(item.id, treeItem);
    });

    // Second pass: Build parent-child relationships
    const rootItems = [];

    apiResults.forEach(item => {
      const currentItem = itemMap.get(item.id);

      if (item.parent === null || item.parent === '' || item.parent === undefined) {
        // This is a root item
        rootItems.push(currentItem);
      } else {
        // This is a child item, find its parent
        const parentItem = itemMap.get(item.parent);
        if (parentItem) {
          currentItem.parentId = parentItem.id;
          parentItem.items.push(currentItem);
        } else {
          // Parent not found, treat as root
          console.warn(`Parent '${item.parent}' not found for item '${item.name}'. Adding as root item.`);
          rootItems.push(currentItem);
        }
      }
    });

    // Sort function to sort items by account number in ascending order
    const sortByAccountNumber = (items) => {
      const sorted = [...items].sort((a, b) => {
        // Get account numbers, default to empty string if not available
        const numA = a.accountNumber ? String(a.accountNumber).trim() : '';
        const numB = b.accountNumber ? String(b.accountNumber).trim() : '';

        // Parse as numbers for proper numerical sorting
        const parsedA = parseInt(numA, 10);
        const parsedB = parseInt(numB, 10);

        // If both are valid numbers, compare numerically
        if (!isNaN(parsedA) && !isNaN(parsedB)) {
          return parsedA - parsedB;
        }

        // If one is NaN, put it at the end
        if (isNaN(parsedA)) return 1;
        if (isNaN(parsedB)) return -1;

        // Fallback to string comparison
        return numA.localeCompare(numB);
      });

      // Recursively sort child items
      return sorted.map(item => {
        if (item.items && item.items.length > 0) {
          return {
            ...item,
            items: sortByAccountNumber(item.items)
          };
        }
        return item;
      });
    };

    // Sort root items and all nested items
    const sortedRootItems = sortByAccountNumber(rootItems);

    console.log('Converted tree structure:', sortedRootItems);
    return sortedRootItems;
  };

  // Fetch data from API
  useEffect(() => {
    const fetchChartOfAccounts = async () => {
      try {
        setLoading(true);
        const url = buildUrl('/chart-of-account');
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiData = await response.json();
        console.log('API Response:', apiData);
        
        if (apiData.results && Array.isArray(apiData.results)) {
          const treeData = convertApiDataToTreeStructure(apiData.results);
          setData(treeData);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (err) {
        console.error('Error fetching chart of accounts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChartOfAccounts();
  }, []);

  // Custom cell component for the IsParent checkbox
  const IsParentCell = (props) => {
    return (
      <td className="k-text-center">
        <span className={`k-badge k-badge-rounded ${props.dataItem.isParent ? 'k-badge-success' : 'k-badge-secondary'}`}>
          {props.dataItem.isParent ? '✓' : '○'}
        </span>
      </td>
    );
  };

  // Custom cell component for Account Number with navigation to chart of account view
  const AccountNumberCell = (props) => {
    const handleLinkClick = (e) => {
      e.preventDefault();

      // Navigate to chart of account view page in the same tab
      navigate(`/chart-of-account/view/${props.dataItem.id}`);
    };

    return (
      <td className="k-text-center">
        <Button
          onClick={handleLinkClick}
          fillMode="flat"
          themeColor="primary"
          size="small"
          className="k-button-link"
          style={{ color: '#007acc' }}
        >
          <span className="k-icon k-i-external-link k-mr-1"></span>
          <span style={{ color: '#007acc' }}>{props.dataItem.accountNumber}</span>
        </Button>
      </td>
    );
  };

  // Custom cell component for Account Type with color-coded badges
  const AccountTypeCell = (props) => {
    const getTypeColor = (type) => {
      switch (type?.toLowerCase()) {
        case 'asset':
          return 'k-badge-success';
        case 'liability':
          return 'k-badge-warning';
        case 'equity':
          return 'k-badge-info';
        case 'income':
        case 'revenue':
          return 'k-badge-primary';
        case 'expense':
          return 'k-badge-error';
        default:
          return 'k-badge-secondary';
      }
    };

    const getTypeIcon = (type) => {
      switch (type?.toLowerCase()) {
        case 'asset':
          return 'k-i-dollar';
        case 'liability':
          return 'k-i-warning';
        case 'equity':
          return 'k-i-user';
        case 'income':
        case 'revenue':
          return 'k-i-plus';
        case 'expense':
          return 'k-i-minus';
        default:
          return 'k-i-file';
      }
    };

    return (
      <td className="k-text-center">
        <span className={`k-badge k-badge-rounded ${getTypeColor(props.dataItem.accountType)}`}>
          <span className={`k-icon ${getTypeIcon(props.dataItem.accountType)} k-mr-1`}></span>
          {props.dataItem.accountType || 'Unknown'}
        </span>
      </td>
    );
  };

  // Custom cell component for Opening Balance
  const OpeningBalanceCell = (props) => {
    const balance = props.dataItem.openingBalance || 0;
    const isNegative = balance < 0;

    return (
      <td className="k-text-right">
        <span className={isNegative ? 'k-text-error' : 'k-text-success'}>
          {Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </td>
    );
  };

  // Custom cell component for Running Balance
  const RunningBalanceCell = (props) => {
    const balance = props.dataItem.runningBalance || 0;
    const isNegative = balance < 0;

    return (
      <td className="k-text-right">
        <span className={isNegative ? 'k-text-error' : 'k-text-success'}>
          {Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </td>
    );
  };

  // Custom cell renderer for Account Name with manual expand/collapse
  const AccountNameCell = (props) => {
    const hasChildren = props.dataItem.items && props.dataItem.items.length > 0;
    
    // Calculate hierarchy level
    const getLevel = (item) => {
      let level = 0;
      
      if (item.parent) {
        // Add additional levels for each parent in the hierarchy
        let currentParent = item.parent;
        const findInData = (data, parentId) => {
          for (const dataItem of data) {
            if (dataItem.id === parentId) return dataItem;
            if (dataItem.items) {
              const found = findInData(dataItem.items, parentId);
              if (found) return found;
            }
          }
          return null;
        };
        
        while (currentParent) {
          level++;
          const parentItem = findInData(data, currentParent);
          currentParent = parentItem ? parentItem.parent : null;
          if (level > 10) break; // Safety check
        }
      }
      
      return level;
    };
    
    const level = getLevel(props.dataItem);
    const paddingLeft = level * 25 + 8;
    
    const handleExpandClick = (e) => {
      e.stopPropagation(); // Prevent event bubbling
      if (hasChildren) {
        console.log('Expanding/Collapsing:', props.dataItem.accountName, 'Current expanded:', props.dataItem.expanded);
        onExpandChange({ dataItem: props.dataItem });
      }
    };
    
    return (
      <td style={{ paddingLeft: `${paddingLeft}px` }}>
        <div className="k-d-flex k-align-items-center k-gap-2">
          {hasChildren ? (
            <span 
              onClick={handleExpandClick}
              className="k-button k-button-flat k-button-sm k-rounded-full k-text-primary"
              style={{ 
                cursor: 'pointer', 
                fontSize: '14px',
                userSelect: 'none',
                minWidth: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              {props.dataItem.expanded ? '▼' : '▶'}
            </span>
          ) : (
            <span style={{ width: '32px' }}></span>
          )}
          <span className="k-font-weight-normal">
            {props.dataItem.accountName}
          </span>
        </div>
      </td>
    );
  };

  // Define columns for TreeList
  const columns = [
    {
      field: 'accountName',
      title: 'Account Name',
      width: '300px',
      cell: AccountNameCell
    },
    {
      field: 'accountType',
      title: 'Account Type',
      width: '130px',
      cell: AccountTypeCell
    },
    {
      field: 'accountNumber',
      title: 'Account Number',
      width: '140px',
      cell: AccountNumberCell
    },
    {
      field: 'openingBalance',
      title: 'Opening Balance',
      width: '150px',
      cell: OpeningBalanceCell
    },
    {
      field: 'runningBalance',
      title: 'Running Balance',
      width: '150px',
      cell: RunningBalanceCell
    }
  ];

  // Handle expand/collapse - simplified version
  const onExpandChange = (event) => {
    console.log('onExpandChange called for:', event.dataItem.accountName);
    const updatedData = [...data];
    
    const updateItem = (items) => {
      return items.map(item => {
        if (item.id === event.dataItem.id) {
          console.log('Found item to toggle:', item.accountName, 'from', item.expanded, 'to', !item.expanded);
          return { ...item, expanded: !item.expanded };
        }
        if (item.items && item.items.length > 0) {
          return { ...item, items: updateItem(item.items) };
        }
        return item;
      });
    };
    
    const newData = updateItem(updatedData);
    console.log('Setting new data:', newData);
    setData(newData);
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const getAllAccounts = (items) => {
      let accounts = [];
      items.forEach(item => {
        accounts.push(item);
        if (item.items && item.items.length > 0) {
          accounts = accounts.concat(getAllAccounts(item.items));
        }
      });
      return accounts;
    };

    const allAccounts = getAllAccounts(data);
    const accountsByType = {};
    
    allAccounts.forEach(account => {
      const type = account.accountType || 'Unknown';
      if (!accountsByType[type]) {
        accountsByType[type] = 0;
      }
      accountsByType[type]++;
    });

    return accountsByType;
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="k-d-flex k-flex-col k-gap-4" style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Card className="k-shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <CardBody>
            <div className="loading-indicator">
              <div className="spinner"></div>
              <div>Loading Chart of Accounts...</div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="k-d-flex k-flex-col k-gap-4" style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Card className="k-shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <CardBody>
            <div className="k-d-flex k-justify-content-center k-align-items-center" style={{ minHeight: '400px' }}>
              <Card className="k-state-empty k-text-center k-p-6">
                <div className="k-icon k-i-warning k-color-error k-font-size-xxl k-mb-4"></div>
                <h3 className="k-text-muted">Error Loading Data</h3>
                <p className="k-text-muted">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  themeColor="primary"
                  className="k-mt-3"
                >
                  Retry
                </Button>
              </Card>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="k-d-flex k-flex-col k-gap-4" style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Card className="k-shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <CardHeader 
          className="k-hbox k-justify-content-between k-align-items-center" 
          style={{ borderRadius: '12px 12px 0 0' }}
        >
          <div>
            <h1 className="k-text-dark k-font-size-xl k-font-weight-bold k-m-0">Chart of Accounts</h1>
            <p className="k-text-secondary k-font-size-sm k-m-0">Financial account structure</p>
          </div>
          <div className="k-d-flex k-gap-2">
            <Button
              onClick={() => navigate('/chart-of-account/new')}
              themeColor="primary"
              className="k-button k-button-md k-rounded-md"
            >
              <FaPlus /> Add New Chart of Account
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {data && data.length > 0 ? (
            <div className="k-d-flex k-flex-col k-gap-3">
              <style>
                {`
                  /* Hide KendoReact's default expand icons since we're using custom ones */
                  .k-treelist .k-hierarchy-cell .k-icon {
                    display: none;
                  }

                  /* Enhanced TreeList styling */
                  .k-treelist {
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    overflow: hidden;
                  }

                  .k-treelist .k-table-thead {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                  }

                  .k-treelist .k-table-thead .k-header {
                    color: white;
                    font-weight: 600;
                  }

                  /* Rounded corners for table header */
                  .k-treelist .k-table-thead .k-header:first-child {
                    border-top-left-radius: 12px;
                  }

                  .k-treelist .k-table-thead .k-header:last-child {
                    border-top-right-radius: 12px;
                  }

                  .k-treelist .k-table-tbody .k-table-row:hover {
                    background-color: #f8f9ff;
                  }

                  /* Loading indicator styles */
                  .loading-indicator {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 400px;
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
                `}
              </style>
              <TreeList
                data={data}
                columns={columns}
                expandField="expanded"
                subItemsField="items"
                onExpandChange={onExpandChange}
                style={{ width: '100%' }}
                idField="id"
                className="k-treelist-enhanced"
              />
            </div>
          ) : (
            <Card className="k-state-empty k-text-center k-p-6">
              <div className="k-icon k-i-warning k-color-warning k-font-size-xxl k-mb-4"></div>
              <h3 className="k-text-muted">No Data Available</h3>
              <p className="k-text-muted">No chart of accounts data found.</p>
            </Card>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ChartOfAccountList; 