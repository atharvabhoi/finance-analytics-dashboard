import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react';
import type { DashboardSummary } from '../types/api';
import { formatCurrency } from '../utils/format';

const cards = [
  { key: 'revenue' as const, label: 'Revenue', icon: ArrowUpRight },
  { key: 'expenses' as const, label: 'Expenses', icon: ArrowDownLeft },
  { key: 'balance' as const, label: 'Balance', icon: Wallet },
  { key: 'savings' as const, label: 'Savings', icon: PiggyBank },
];

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function SummaryCards({ summary, loading, error, onRetry }: SummaryCardsProps) {
  if (error) {
    return (
      <section className="panel-error" aria-live="polite">
        <p>{error}</p>
        <button type="button" className="text-button" onClick={onRetry}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="summary-grid" aria-label="Financial summary">
      {cards.map(({ key, label, icon: Icon }) => (
        <article key={key} className={`summary-card ${key === 'balance' ? 'is-accent' : ''}`}>
          <div className="summary-icon">
            <Icon size={18} />
          </div>
          <p className="summary-label">{label}</p>
          {loading || !summary ? (
            <div className="skeleton skeleton-value" />
          ) : (
            <p className="summary-value">{formatCurrency(summary[key])}</p>
          )}
        </article>
      ))}
    </section>
  );
}
