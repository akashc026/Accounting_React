import React from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Button } from '@progress/kendo-react-buttons';
import { FaExclamationTriangle, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // warning, danger, info, success
  loading = false,
  icon = null
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'danger':
        return <FaTrash className="dialog-icon danger" />;
      case 'warning':
        return <FaExclamationTriangle className="dialog-icon warning" />;
      case 'success':
        return <FaCheck className="dialog-icon success" />;
      case 'info':
      default:
        return <FaExclamationTriangle className="dialog-icon info" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'k-button k-button-danger';
      case 'warning':
        return 'k-button k-button-warning';
      case 'success':
        return 'k-button k-button-success';
      case 'info':
      default:
        return 'k-button k-button-primary';
    }
  };

  return createPortal(
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog-container">
        <div className="confirm-dialog-header">
          <h3 className="confirm-dialog-title">{title}</h3>
          <button
            className="confirm-dialog-close"
            onClick={onClose}
            disabled={loading}
          >
            <FaTimes />
          </button>
        </div>

        <div className="confirm-dialog-content">
          <div className="dialog-icon-container">
            {getIcon()}
          </div>
          <div className="dialog-message">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
        </div>

        <div className="confirm-dialog-actions">
          <Button
            onClick={onClose}
            className="k-button k-button-secondary"
            disabled={loading}
          >
            <FaTimes style={{ marginRight: '6px' }} />
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={getConfirmButtonClass()}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small" style={{ marginRight: '6px' }}></div>
                Processing...
              </>
            ) : (
              <>
                <FaCheck style={{ marginRight: '6px' }} />
                {confirmText}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
