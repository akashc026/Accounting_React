const styles = `
  .apply-tab-container {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid #e8eaed;
    margin: 16px 0 0;
    background: transparent;
    padding: 0;
    flex-wrap: wrap;
  }

  .apply-tab-container.compact {
    margin-top: 8px;
  }

  .apply-tab-button {
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

  .apply-tab-button:hover {
    background: #e8f0fe;
    color: #1a73e8;
  }

  .apply-tab-button.active {
    background: white;
    color: #1a73e8;
    border-bottom: 2px solid white;
    margin-bottom: -2px;
    font-weight: 700;
  }

  .apply-tab-button:focus {
    outline: 2px solid #1a73e8;
    outline-offset: 2px;
  }
`;

const injectApplyTabStyles = () => {
  if (typeof document === 'undefined') {
    return;
  }
  if (document.getElementById('apply-tab-shared-styles')) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'apply-tab-shared-styles';
  style.textContent = styles;
  document.head.appendChild(style);
};

export default injectApplyTabStyles;
