import { useState } from 'react';
import type { Transaction } from '../types/api';
import { formatCurrency, formatDate } from '../utils/format';

interface RecentTransactionsProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function RecentTransactions({ transactions, loading, error, onRetry }: RecentTransactionsProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Activity</p>
          <h2>Recent transactions</h2>
        </div>
      </div>

      {error ? (
        <div className="panel-error">
          <p>{error}</p>
          <button type="button" className="text-button" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <ul className="transaction-list">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index} className="transaction-row">
              <div className="skeleton skeleton-avatar" />
              <div className="transaction-copy">
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line short" />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && !error && transactions.length === 0 ? <p className="empty-copy">No recent transactions found.</p> : null}

      {!loading && !error && transactions.length > 0 ? (
        <ul className="transaction-list">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <li className="transaction-row">
      {imageFailed ? (
        <span className="avatar-fallback">{transaction.user_id.slice(-3)}</span>
      ) : (
        <img
          className="avatar"
          src={transaction.user_profile}
          alt=""
          onError={() => setImageFailed(true)}
        />
      )}
      <div className="transaction-copy">
        <p className="transaction-title">{transaction.user_id}</p>
        <p className="transaction-meta">{formatDate(transaction.date)}</p>
      </div>
      <p className={`transaction-amount ${transaction.category === 'Expense' ? 'is-expense' : 'is-revenue'}`}>
        {transaction.category === 'Expense' ? '-' : '+'}
        {formatCurrency(transaction.amount)}
      </p>
      <span className={`status-pill ${transaction.status === 'Paid' ? 'is-paid' : 'is-pending'}`}>{transaction.status}</span>
    </li>
  );
}
