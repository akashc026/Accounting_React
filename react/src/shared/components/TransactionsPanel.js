import React from 'react';
import { FaEye } from 'react-icons/fa';

export const TransactionsPanel = ({
  loading,
  transactions = [],
  recordType,
  onNavigate
}) => {
  if (loading) {
    return (
      <div className="transactions-section">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <p className="empty-state-text">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="transactions-section">
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <p className="empty-state-text">
            No payment transactions found for this {recordType?.toLowerCase()}.
          </p>
        </div>
      </div>
    );
  }

  const handleNavigate = (event, path) => {
    event.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <div className="transactions-section">
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Type</th>
            <th>Payment ID</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => {
            const isCustomerPayment = transaction.transactionType === 'Customer Payment';
            const isVendorPayment = transaction.transactionType === 'Vendor Payment';
            const isCreditMemo = transaction.transactionType === 'Credit Memo';
            const isVendorCredit = transaction.transactionType === 'Vendor Credit';

            let linkTarget = '#';
            if (isCustomerPayment) {
              linkTarget = `/customer-payment/view/${transaction.paymentId}`;
            } else if (isVendorPayment) {
              linkTarget = `/vendor-payment/view/${transaction.paymentId}`;
            } else if (isCreditMemo) {
              linkTarget = `/credit-memo/view/${transaction.paymentId || transaction.cmid}`;
            } else if (isVendorCredit) {
              linkTarget = `/vendor-credit/view/${transaction.paymentId || transaction.vcid}`;
            }

            return (
              <tr key={transaction.id || index}>
                <td>
                  <a
                    href={linkTarget}
                    className="view-link"
                    onClick={(event) => handleNavigate(event, linkTarget)}
                  >
                    <FaEye /> View
                  </a>
                </td>
                <td>
                  <span className="payment-id">{transaction.transactionType}</span>
                </td>
                <td>
                  <span className="payment-id">
                    {transaction.paymentSeqNum ||
                      transaction.creditMemoSeqNum ||
                      transaction.vendorPaymentSeqNum ||
                      transaction.vendorCreditSeqNum ||
                      'N/A'}
                  </span>
                </td>
                <td>
                  <span className="payment-amount">
                    {(transaction.paymentAmount || 0).toFixed(2)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const GlImpactPanel = ({ loading, entries = [], recordType }) => {
  if (loading) {
    return (
      <div className="transactions-section">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <p className="empty-state-text">Loading GL Impact data...</p>
        </div>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="transactions-section">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-text">
            No GL Impact data found for this {recordType?.toLowerCase()}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-section">
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Memo</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.id || index}>
              <td>{entry.accountName || ''}</td>
              <td>
                <span className="payment-amount">
                  {entry.debit ? entry.debit.toFixed(2) : '0.00'}
                </span>
              </td>
              <td>
                <span className="payment-amount">
                  {entry.credit ? entry.credit.toFixed(2) : '0.00'}
                </span>
              </td>
              <td>{entry.memo || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsPanel;
