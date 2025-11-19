import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DrawerComponent = ({ expanded, setExpanded }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSubmenus, setExpandedSubmenus] = useState(new Set(['masterdata'])); // Force Master Data to be expanded

  // Initialize based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const initialExpanded = new Set();
    
    // Set initial expanded state based on route
    if (currentPath.startsWith('/forms')) {
      initialExpanded.add('forms');
    } else if (currentPath.startsWith('/inventory-adjustment') || currentPath.startsWith('/inventory-transfer')) {
      initialExpanded.add('inventory');
    } else if (currentPath.startsWith('/sales-order') || currentPath.startsWith('/item-fulfillment') || currentPath.startsWith('/invoice') || currentPath.startsWith('/credit-memo') || currentPath.startsWith('/debit-memo') || currentPath.startsWith('/customer-payment')) {
      initialExpanded.add('transaction');
    } else if (currentPath.startsWith('/purchase-order') || currentPath.startsWith('/item-receipt') || currentPath.startsWith('/vendor-bill') || currentPath.startsWith('/vendor-credit') || currentPath.startsWith('/vendor-payment')) {
      initialExpanded.add('purchases');
    } else if (currentPath.startsWith('/journal-entry')) {
      initialExpanded.add('journal');
    } else if (currentPath.startsWith('/customer') || currentPath.startsWith('/vendor') || currentPath.startsWith('/chart-of-account') || currentPath.startsWith('/location') || currentPath.startsWith('/product') || currentPath.startsWith('/tax')) {
      initialExpanded.add('masterdata');
    }
    
    if (initialExpanded.size > 0) {
      setExpandedSubmenus(initialExpanded);
    }
  }, [location.pathname]);

  const items = [
    {
      text: 'Forms',
      icon: 'k-i-form',
      id: 'forms',
      items: [
        {
          text: 'Form List',
          icon: 'k-i-grid',
          route: '/forms',
          selected: location.pathname === '/forms'
        }
      ]
    },
     {
      text: 'Master Data',
      icon: 'k-i-folder-open',
      id: 'masterdata',
      items: [
        {
          text: 'Customers',
          icon: 'k-i-user',
          route: '/customer',
          selected: location.pathname.startsWith('/customer')
        },
        {
          text: 'Vendors',
          icon: 'k-i-hyperlink-email',
          route: '/vendor',
          selected: location.pathname.startsWith('/vendor')
        },
        {
          text: 'Chart of Accounts',
          icon: 'k-i-table-align',
          route: '/chart-of-account',
          selected: location.pathname.startsWith('/chart-of-account')
        },
        {
          text: 'Locations',
          icon: 'k-i-pin',
          route: '/location',
          selected: location.pathname.startsWith('/location')
        },
        {
          text: 'Products',
          icon: 'k-i-shopping-cart',
          route: '/product',
          selected: location.pathname.startsWith('/product')
        },
        {
          text: 'Taxes',
          icon: 'k-i-calculator',
          route: '/tax',
          selected: location.pathname.startsWith('/tax')
        }
      ]
    },
    {
      text: 'Inventory',
      icon: 'k-i-box',
      id: 'inventory',
      items: [
        {
          text: 'Inventory Adjustment',
          icon: 'k-i-grid-settings',
          route: '/inventory-adjustment',
          selected: location.pathname.startsWith('/inventory-adjustment')
        },
        {
          text: 'Inventory Transfer',
          icon: 'k-i-arrow-right',
          route: '/inventory-transfer',
          selected: location.pathname.startsWith('/inventory-transfer')
        }
      ]
    },
    {
      text: 'Sales',
      icon: 'k-i-dollar',
      id: 'transaction',
      items: [
        {
          text: 'Sales Order',
          icon: 'k-i-grid',
          route: '/sales-order',
          selected: location.pathname.startsWith('/sales-order')
        },
        {
          text: 'Item Fulfillment',
          icon: 'k-i-check',
          route: '/item-fulfillment',
          selected: location.pathname.startsWith('/item-fulfillment')
        },
        {
          text: 'Invoice',
          icon: 'k-i-dollar',
          route: '/invoice',
          selected: location.pathname.startsWith('/invoice')
        },
        {
          text: 'Credit Memo',
          icon: 'k-i-minus',
          route: '/credit-memo',
          selected: location.pathname.startsWith('/credit-memo')
        },
        {
          text: 'Debit Memo',
          icon: 'k-i-plus',
          route: '/debit-memo',
          selected: location.pathname.startsWith('/debit-memo')
        },
        {
          text: 'Customer Payment',
          icon: 'k-i-dollar',
          route: '/customer-payment',
          selected: location.pathname.startsWith('/customer-payment')
        }
      ]
    },
    {
      text: 'Purchases',
      icon: 'k-i-cart',
      id: 'purchases',
      items: [
        {
          text: 'Purchase Order',
          icon: 'k-i-grid',
          route: '/purchase-order',
          selected: location.pathname.startsWith('/purchase-order')
        },
        {
          text: 'Item Receipt',
          icon: 'k-i-check',
          route: '/item-receipt',
          selected: location.pathname.startsWith('/item-receipt')
        },
        {
          text: 'Vendor Bill',
          icon: 'k-i-dollar',
          route: '/vendor-bill',
          selected: location.pathname.startsWith('/vendor-bill')
        },
        {
          text: 'Vendor Credit',
          icon: 'k-i-minus',
          route: '/vendor-credit',
          selected: location.pathname.startsWith('/vendor-credit')
        },
        {
          text: 'Vendor Payment',
          icon: 'k-i-dollar',
          route: '/vendor-payment',
          selected: location.pathname.startsWith('/vendor-payment')
        }
      ]
    },
    {
      text: 'Journal',
      icon: 'k-i-book',
      id: 'journal',
      items: [
        {
          text: 'Journal Entry',
          icon: 'k-i-edit',
          route: '/journal-entry',
          selected: location.pathname.startsWith('/journal-entry')
        }
      ]
    },
    {
      text: 'Reports',
      icon: 'k-i-chart',
      id: 'reports',
      items: [
        {
          text: 'Charts',
          icon: 'k-i-file-txt',
          route: '/charts',
          selected: location.pathname === '/charts'
        },
        {
          text: 'COA Relation',
          icon: 'k-i-table-align',
          route: '/coa-relation',
          selected: location.pathname === '/coa-relation'
        }
      ]
    }
  ];



  const handleItemClick = (item) => {
    if (item.items) {
      const isCurrentlyExpanded = expandedSubmenus.has(item.id);
      
      setExpandedSubmenus(prev => {
        const newSet = new Set(prev);
        
        if (isCurrentlyExpanded) {
          // Close this item and its children
          newSet.delete(item.id);
          
          // Close children recursively
          const closeChildren = (parentItem) => {
            if (parentItem.items) {
              parentItem.items.forEach(child => {
                if (child.id) {
                  newSet.delete(child.id);
                  closeChildren(child);
                }
              });
            }
          };
          closeChildren(item);
          
        } else {
          // Open this item
          newSet.add(item.id);
          
          // ONLY close other top-level menus, NOT sibling menus
          if (['forms', 'inventory', 'transaction', 'masterdata', 'purchases', 'journal', 'reports'].includes(item.id)) {
            // This is a top-level menu - close other top-level menus
            ['forms', 'inventory', 'transaction', 'masterdata', 'purchases', 'journal', 'reports'].forEach(topLevelId => {
              if (topLevelId !== item.id) {
                newSet.delete(topLevelId);
                // Close their children
                const topItem = items.find(i => i.id === topLevelId);
                if (topItem && topItem.items) {
                  topItem.items.forEach(child => {
                    if (child.id) newSet.delete(child.id);
                  });
                }
              }
            });
          } else {
            // This is a sub-menu item (like Customers, Vendors, Items, Chart of Accounts)
            // For sub-menus under Master Data, close other expanded sub-menus but keep Master Data open
            if (item.id === 'customers' || item.id === 'vendors' || item.id === 'chart-of-account') {
              // Close other Master Data sub-menus but keep Master Data itself open
              ['customers', 'vendors', 'chart-of-account'].forEach(subMenuId => {
                if (subMenuId !== item.id) {
                  newSet.delete(subMenuId);
                }
              });
              // Ensure Master Data stays open
              newSet.add('masterdata');
            }
          }
        }
        
        return newSet;
      });
    } else if (item.route) {
      navigate(item.route);
      if (window.innerWidth < 768) {
        setExpanded(false);
      }
    }
  };

  const renderMenuItem = (item, level = 0) => {
    const isSelected = item.selected;
    const hasSubmenu = item.items && item.items.length > 0;
    const isSubmenuExpanded = expandedSubmenus.has(item.id);



    const shouldShowSubmenu = hasSubmenu && expanded && isSubmenuExpanded;
    
    // Create a stable key for this item
    const itemKey = item.id || item.route || `${item.text}-${level}`;
    
    return (
      <div key={itemKey} className="menu-item-container">
        <div
          className={`drawer-item ${isSelected ? 'selected' : ''} ${hasSubmenu ? 'has-submenu' : ''} ${level > 0 ? 'submenu-item' : ''}`}
          onClick={() => handleItemClick(item)}
        >
          <div className="item-content">
            <span className={`menu-icon ${item.icon}`}></span>
            <div className={`item-text-container ${expanded ? 'visible' : ''}`}>
              <span className="item-text">{item.text}</span>
              {hasSubmenu && expanded && (
                <span className={`submenu-arrow k-i-arrow-chevron-right ${isSubmenuExpanded ? 'expanded' : ''}`}></span>
              )}
            </div>
          </div>
        </div>
        {shouldShowSubmenu && (
          <div className="submenu">
            {item.items && item.items.map((subItem, index) => {
              return renderMenuItem(subItem, level + 1);
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`drawer-container ${expanded ? 'expanded' : ''}`}>
      <div className="drawer-content">
        {items.map((item, index) => {
          return renderMenuItem(item);
        })}
      </div>
    </div>
  );
};

export default DrawerComponent; 