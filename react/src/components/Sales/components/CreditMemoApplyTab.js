import React from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';

const CreditMemoApplyTab = ({
  mode,
  invoices,
  creditAmount,
  appliedTo,
  unapplied,
  loading,
  onClearAll,
  onHeaderToggle,
  onInvoiceCheck,
  onInvoiceApplyChange,
  onInvoiceApplyFocus,
  onInvoiceApplyBlur,
  headerChecked
}) => {
  if (mode !== 'view' && mode !== 'edit' && mode !== 'new') {
    return null;
  }

  return (
    <div className="payment-container apply-invoice-tab-container">
      <style>{`
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; color: #333; }
        .payment-container { max-width: 1200px; margin: 0 auto; background-color: #fff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .header-bar { background-color: #f7f9fa; padding: 15px 20px; border-bottom: 1px solid #ddd; display: flex; align-items: center; gap: 20px; }
        .header-bar label { font-weight: 600; margin-right: 5px; font-size: 14px; }
        .header-bar .k-numerictextbox { width: 140px; }
        .main-controls-area { padding: 20px 20px 0 20px; }
        .controls-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .subtab-nav { border-bottom: 2px solid #dee2e6; display: flex; }
        .subtab-link { background: none; border: none; padding: 10px 15px; cursor: pointer; font-size: 14px; font-weight: 600; color: #007bff; margin-bottom: -2px; }
        .subtab-link.active { border-bottom: 2px solid #007bff; }
        .subtab-header { background-color: #f7f9fa; padding: 10px 20px; border-bottom: 1px solid #ddd; display: flex; gap: 30px; font-size: 14px; font-weight: bold; }
        .subtab-content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        thead { background-color: #f7f9fa; }
        th { font-weight: 600; color: #555; }
        tr:hover { background-color: #f5f5f5; }
        .text-right { text-align: right; }
        .payment-input .k-numerictextbox { width: 90%; }
        .payment-input .k-numerictextbox .k-input { text-align: right; }
      `}</style>

      <div className="header-bar">
        <div>
          <label htmlFor="creditAmountLimit">CREDIT AMOUNT *</label>
          <NumericTextBox
            id="creditAmountLimit"
            placeholder="0.00"
            min={0}
            step={0}
            format="n2"
            decimals={2}
            spinners={false}
            value={creditAmount}
            disabled
          />
        </div>
      </div>

      <div className="main-controls-area">
        <div className="controls-top-row">
          <div>
            <Button
              type="button"
              disabled={mode === 'view'}
              onClick={(event) => {
                event.preventDefault();
                onClearAll();
              }}
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="subtab-nav">
          <Button type="button" className="subtab-link active" hidden={mode === 'view'}>
            Invoices/Debitmemos
          </Button>
        </div>
      </div>

      <div className="subtab-header">
        <span>
          Applied : <strong>{appliedTo.toFixed(2)}</strong>
        </span>
        <span>&bull;</span>
        <span>
          Unapplied Amount : <strong>{unapplied.toFixed(2)}</strong>
        </span>
      </div>

      <div className="subtab-content">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Loading invoices and debit memos...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>No invoices or debit memos found for this customer.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  <Checkbox
                    className="header-checkbox"
                    checked={headerChecked}
                    disabled={mode === 'view'}
                    onChange={onHeaderToggle}
                  />
                </th>
                <th>DATE</th>
                <th>TYPE</th>
                <th>REF NO.</th>
                <th className="text-right">ORG AMT</th>
                <th className="text-right">AMT. DUE</th>
                <th className="k-text-center">CREDIT</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((row) => {
                const displayValue = row.displayAmount === 0 ? '' : row.displayAmount.toFixed(2);
                return (
                  <tr key={row.id}>
                    <td>
                      <Checkbox
                        className="invoice-checkbox"
                        checked={row.checked}
                        disabled={mode === 'view' || row.disabled}
                        onChange={(event) => onInvoiceCheck(row.id, event.value ?? event.target?.checked ?? false)}
                      />
                    </td>
                    <td>{row.date}</td>
                    <td>{row.type}</td>
                    <td>{row.refNo}</td>
                    <td className="text-right">{(row.originalAmount || 0).toFixed(2)}</td>
                    <td className="text-right">{row.dueAmount.toFixed(2)}</td>
                    <td className="text-right payment-input">
                      <NumericTextBox
                        value={displayValue}
                        disabled={mode === 'view'}
                        onChange={(event) => onInvoiceApplyChange(row.id, event.target.value)}
                        onFocus={() => onInvoiceApplyFocus(row.id)}
                        onBlur={() => onInvoiceApplyBlur(row.id)}
                        format="n2"
                        step={0}
                        spinners={false}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CreditMemoApplyTab;
