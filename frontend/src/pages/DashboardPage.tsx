import { useCallback, useEffect, useState } from 'react';
import { ApiError, fetchDashboardOverview, fetchDashboardSummary, fetchRecentTransactions } from '../api/client';
import { OverviewChart } from '../components/OverviewChart';
import { RecentTransactions } from '../components/RecentTransactions';
import { SummaryCards } from '../components/SummaryCards';
import type { DashboardSummary, MonthlyOverview, Transaction } from '../types/api';

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Unable to load dashboard data.';
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [overview, setOverview] = useState<MonthlyOverview[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [summaryState, setSummaryState] = useState<{ loading: boolean; error: string | null }>({
    loading: true,
    error: null,
  });
  const [overviewState, setOverviewState] = useState<{ loading: boolean; error: string | null }>({
    loading: true,
    error: null,
  });
  const [recentState, setRecentState] = useState<{ loading: boolean; error: string | null }>({
    loading: true,
    error: null,
  });

  const loadSummary = useCallback(async () => {
    setSummaryState({ loading: true, error: null });
    try {
      const data = await fetchDashboardSummary();
      setSummary(data);
      setSummaryState({ loading: false, error: null });
    } catch (error: unknown) {
      setSummaryState({ loading: false, error: toErrorMessage(error) });
    }
  }, []);

  const loadOverview = useCallback(async () => {
    setOverviewState({ loading: true, error: null });
    try {
      const data = await fetchDashboardOverview();
      setOverview(data);
      setOverviewState({ loading: false, error: null });
    } catch (error: unknown) {
      setOverviewState({ loading: false, error: toErrorMessage(error) });
    }
  }, []);

  const loadRecent = useCallback(async () => {
    setRecentState({ loading: true, error: null });
    try {
      const data = await fetchRecentTransactions();
      setRecent(data);
      setRecentState({ loading: false, error: null });
    } catch (error: unknown) {
      setRecentState({ loading: false, error: toErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    void loadSummary();
    void loadOverview();
    void loadRecent();
  }, [loadSummary, loadOverview, loadRecent]);

  return (
    <div className="dashboard">
      <SummaryCards
        summary={summary}
        loading={summaryState.loading}
        error={summaryState.error}
        onRetry={() => void loadSummary()}
      />
      <div className="dashboard-grid">
        <OverviewChart
          data={overview}
          loading={overviewState.loading}
          error={overviewState.error}
          onRetry={() => void loadOverview()}
        />
        <RecentTransactions
          transactions={recent}
          loading={recentState.loading}
          error={recentState.error}
          onRetry={() => void loadRecent()}
        />
      </div>
    </div>
  );
}
