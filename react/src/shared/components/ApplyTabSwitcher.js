import React from 'react';
import injectApplyTabStyles from '../styles/applyTabs';

injectApplyTabStyles();

const ApplyTabSwitcher = ({
  activeTab,
  onTabChange,
  itemsLabel = 'Items',
  applyLabel = 'Apply',
  className = ''
}) => {
  const handleTabChange = (nextTab) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof onTabChange === 'function') {
      onTabChange(nextTab);
    }
  };

  return (
    <div className={`apply-tab-container ${className}`.trim()}>
      <button
        type="button"
        className={`apply-tab-button ${activeTab === 'items' ? 'active' : ''}`}
        onClick={handleTabChange('items')}
      >
        📋 {itemsLabel}
      </button>
      <button
        type="button"
        className={`apply-tab-button ${activeTab === 'apply' ? 'active' : ''}`}
        onClick={handleTabChange('apply')}
      >
        💳 {applyLabel}
      </button>
    </div>
  );
};

export default ApplyTabSwitcher;
