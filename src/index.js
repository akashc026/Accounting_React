import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Disable console logs for the entire application
window['console'] = {
  log: function() {},
  error: function() {},
  warn: function() {},
  info: function() {},
  debug: function() {},
  trace: function() {},
  table: function() {},
  group: function() {},
  groupEnd: function() {},
  groupCollapsed: function() {},
  clear: function() {},
  count: function() {},
  countReset: function() {},
  time: function() {},
  timeEnd: function() {},
  timeLog: function() {},
  assert: function() {},
  dir: function() {},
  dirxml: function() {}
};

// Simple dropdown position fixer
const fixDropdownPositions = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.classList && (node.classList.contains('k-animation-container') || node.classList.contains('k-popup'))) {
          // Found a dropdown popup
          setTimeout(() => {
            const popup = node.querySelector('.k-popup.k-dropdown-popup') || (node.classList.contains('k-popup') ? node : null);
            if (popup) {
              // Find the currently focused dropdown trigger
              const activeDropdown = document.querySelector('.k-dropdown-wrap.k-state-focused, .k-dropdown-wrap.k-state-active');
              
              if (activeDropdown) {
                const rect = activeDropdown.getBoundingClientRect();
                
                // Only fix positioning, don't touch visibility
                popup.style.position = 'fixed';
                popup.style.left = rect.left + 'px';
                popup.style.top = (rect.bottom + 2) + 'px';
                popup.style.width = Math.max(rect.width, 200) + 'px';
                popup.style.zIndex = '10001';
              }
            }
          }, 10);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Start the observer when the page loads
document.addEventListener('DOMContentLoaded', fixDropdownPositions);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
