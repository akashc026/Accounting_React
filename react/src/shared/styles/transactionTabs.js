const sharedStyles = `
  .transactions-section {
    padding: 24px;
    background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
    border-radius: 0;
    margin: 0;
    min-height: 300px;
  }

  .transactions-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f1f3f4;
  }

  .transactions-header h3 {
    margin: 0;
    color: #202124;
    font-size: 16px;
    font-weight: 600;
  }

  .transactions-icon {
    color: #1a73e8;
    font-size: 16px;
  }

  .transactions-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06);
    border: 1px solid #e8eaed;
    background: white;
  }

  .transactions-table th {
    background: linear-gradient(135deg, #f8f9fa 0%, #e8eaed 100%);
    color: #5f6368;
    padding: 10px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    position: relative;
    border: none;
    border-bottom: 2px solid #e8eaed;
  }

  .transactions-table th:first-child {
    border-radius: 8px 0 0 0;
  }

  .transactions-table th:last-child {
    border-radius: 0 8px 0 0;
  }

  .transactions-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f3f4;
    font-size: 13px;
    color: #202124;
    font-weight: 400;
    position: relative;
    vertical-align: middle;
  }

  .transactions-table tbody tr {
    transition: all 0.3s ease;
    background: white;
  }

  .transactions-table tbody tr:nth-child(even) {
    background: #fafbfc;
  }

  .transactions-table tbody tr:hover {
    background: linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(26,115,232,0.12);
  }

  .transactions-table tbody tr:hover td {
    color: #1a73e8;
  }

  .transactions-table tbody tr:last-child td {
    border-bottom: none;
  }

  .transactions-table tbody tr:last-child td:first-child {
    border-radius: 0 0 0 8px;
  }

  .transactions-table tbody tr:last-child td:last-child {
    border-radius: 0 0 8px 0;
  }

  .view-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 13px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(26,115,232,0.2);
    border: none;
  }

  .view-link:hover {
    background: linear-gradient(135deg, #1557b0 0%, #1a73e8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(26,115,232,0.3);
    color: white;
    text-decoration: none;
  }

  .payment-amount {
    font-weight: 600;
    color: #137333;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .payment-amount::before {
    font-size: 12px;
    color: #5f6368;
  }

  .payment-id {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    background: #f8f9fa;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    color: #5f6368;
    border: 1px solid #e8eaed;
    font-weight: 500;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #5f6368;
  }

  .empty-state-icon {
    font-size: 36px;
    color: #dadce0;
    margin-bottom: 12px;
  }

  .empty-state-text {
    font-size: 14px;
    font-weight: 400;
    margin: 0;
  }
`;

const createTabStyles = ({ tabsClass, tabClass, tabContentClass }) => `
  .${tabsClass} {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid #e8eaed;
    margin-bottom: 0;
    background: transparent;
    padding: 0;
  }

  .${tabClass} {
    padding: 8px 16px;
    background: #f8f9fa;
    border: 1px solid #e8eaed;
    border-bottom: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: #5f6368;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    position: relative;
    border-radius: 6px 6px 0 0;
    white-space: nowrap;
  }

  .${tabClass}:hover {
    background: #e8f0fe;
    color: #1a73e8;
  }

  .${tabClass}.active {
    background: white;
    color: #1a73e8;
    border-bottom: 2px solid white;
    margin-bottom: -2px;
    font-weight: 700;
  }

  .${tabClass} svg {
    font-size: 14px;
  }

  .${tabClass}:nth-child(1) svg {
    color: #4285f4;
  }

  .${tabClass}:nth-child(1).active svg {
    color: #4285f4;
  }

  .${tabClass}:nth-child(2) svg {
    color: #ea4335;
  }

  .${tabClass}:nth-child(2).active svg {
    color: #ea4335;
  }

  .${tabClass}:nth-child(3) svg {
    color: #34a853;
  }

  .${tabClass}:nth-child(3).active svg {
    color: #34a853;
  }

  .${tabContentClass} {
    background: white;
    border: 1px solid #e8eaed;
    border-top: none;
    padding: 0;
    min-height: 300px;
  }
`;

const ensureStyle = (id, css) => {
  if (typeof document === 'undefined') {
    return;
  }
  if (document.getElementById(id)) {
    return;
  }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
};

export const injectTransactionTabStyles = ({ tabsClass, tabClass, tabContentClass }) => {
  if (!tabsClass || !tabClass || !tabContentClass) {
    throw new Error('tabsClass, tabClass, and tabContentClass are required to inject tab styles');
  }

  ensureStyle('transaction-tab-shared-styles', sharedStyles);
  const specificId = `transaction-tab-${tabsClass}-styles`;
  ensureStyle(specificId, createTabStyles({ tabsClass, tabClass, tabContentClass }));
};

export default injectTransactionTabStyles;
