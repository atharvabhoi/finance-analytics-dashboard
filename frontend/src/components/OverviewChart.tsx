import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyOverview } from '../types/api';
import { formatCurrency } from '../utils/format';

interface OverviewChartProps {
  data: MonthlyOverview[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function OverviewChart({ data, loading, error, onRetry }: OverviewChartProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2>Monthly revenue vs expenses</h2>
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

      {loading ? <div className="skeleton skeleton-chart" /> : null}

      {!loading && !error && data.length === 0 ? <p className="empty-copy">No monthly totals are available yet.</p> : null}

      {!loading && !error && data.length > 0 ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#929eae', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#929eae', fontSize: 12 }} tickFormatter={(value: number) => `$${value}`} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                contentStyle={{ borderRadius: 12, border: '1px solid #ececec' }}
              />
              <Legend iconType="circle" />
              <Bar dataKey="revenue" name="Revenue" fill="#c8ee44" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expenses" name="Expenses" fill="#29a073" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </section>
  );
}
