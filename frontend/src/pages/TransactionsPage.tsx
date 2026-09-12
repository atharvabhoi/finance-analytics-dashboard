import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { ApiError, fetchTransactions } from '../api/client';
import type { SortOrder, Transaction, TransactionQuery, TransactionSortBy } from '../types/api';
import { formatCurrency, formatDate } from '../utils/format';

const PAGE_SIZE = 20;

interface FilterState {
  category: '' | Transaction['category'];
  status: '' | Transaction['status'];
  user: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

const emptyFilters: FilterState = {
  category: '',
  status: '',
  user: '',
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
};

const columns: Array<{ label: string; field: TransactionSortBy }> = [
  { label: 'Date', field: 'date' },
  { label: 'ID', field: 'id' },
  { label: 'User', field: 'user_id' },
  { label: 'Category', field: 'category' },
  { label: 'Status', field: 'status' },
  { label: 'Amount', field: 'amount' },
];

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Unable to load transactions.';
}

function SortIndicator({ active, direction }: { active: boolean; direction: SortOrder }) {
  if (!active) {
    return <ArrowUpDown size={14} aria-hidden="true" />;
  }

  return direction === 'asc' ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />;
}

export function TransactionsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [sortBy, setSortBy] = useState<TransactionSortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const query = useMemo<TransactionQuery>(
    () => ({
      ...filters,
      category: filters.category || undefined,
      status: filters.status || undefined,
      search,
      sortBy,
      sortOrder,
      page,
      limit: PAGE_SIZE,
    }),
    [filters, page, search, sortBy, sortOrder],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchTransactions(query);
        if (!cancelled) {
          setTransactions(response.data);
          setTotal(response.total);
          setTotalPages(response.totalPages);
        }
      } catch (caught: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(caught));
          setTransactions([]);
          setTotal(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTransactions();
    return () => {
      cancelled = true;
    };
  }, [query, reloadCount]);

  const activeFilters = useMemo(() => {
    const chips: Array<{ key: keyof FilterState | 'search'; label: string }> = [];
    if (search) chips.push({ key: 'search', label: `Search: ${search}` });
    if (filters.category) chips.push({ key: 'category', label: `Category: ${filters.category}` });
    if (filters.status) chips.push({ key: 'status', label: `Status: ${filters.status}` });
    if (filters.user) chips.push({ key: 'user', label: `User: ${filters.user}` });
    if (filters.dateFrom) chips.push({ key: 'dateFrom', label: `From: ${filters.dateFrom}` });
    if (filters.dateTo) chips.push({ key: 'dateTo', label: `To: ${filters.dateTo}` });
    if (filters.minAmount) chips.push({ key: 'minAmount', label: `Min: ${filters.minAmount}` });
    if (filters.maxAmount) chips.push({ key: 'maxAmount', label: `Max: ${filters.maxAmount}` });
    return chips;
  }, [filters, search]);

  function updateFilter(key: keyof FilterState, value: string) {
    setFilters((current) => ({ ...current, [key]: value } as FilterState));
    setPage(1);
  }

  function clearAll() {
    setSearchInput('');
    setSearch('');
    setFilters(emptyFilters);
    setPage(1);
  }

  function removeFilter(key: keyof FilterState | 'search') {
    if (key === 'search') {
      setSearchInput('');
      setSearch('');
    } else {
      updateFilter(key, '');
    }
    setPage(1);
  }

  function changeSort(field: TransactionSortBy) {
    if (sortBy === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
    setPage(1);
  }

  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, total);

  return (
    <main className="transactions-page">
      <section className="transactions-toolbar panel">
        <div className="transactions-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search ID, category, status, user, or amount"
            aria-label="Search transactions"
          />
        </div>

        <div className="filter-grid" aria-label="Transaction filters">
          <label>
            From
            <input type="date" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={filters.dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} />
          </label>
          <label>
            Min amount
            <input type="number" min="0" step="0.01" value={filters.minAmount} onChange={(event) => updateFilter('minAmount', event.target.value)} />
          </label>
          <label>
            Max amount
            <input type="number" min="0" step="0.01" value={filters.maxAmount} onChange={(event) => updateFilter('maxAmount', event.target.value)} />
          </label>
          <label>
            Category
            <select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
              <option value="">All categories</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </label>
          <label>
            Status
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </label>
          <label>
            User
            <input type="text" value={filters.user} onChange={(event) => updateFilter('user', event.target.value)} placeholder="user_001" />
          </label>
        </div>

        {activeFilters.length > 0 ? (
          <div className="active-filters">
            <span className="active-filter-label"><SlidersHorizontal size={15} aria-hidden="true" /> Active filters</span>
            {activeFilters.map((filter) => (
              <button className="filter-chip" type="button" key={filter.key} onClick={() => removeFilter(filter.key)}>
                {filter.label} <X size={14} aria-hidden="true" />
              </button>
            ))}
            <button className="clear-filters" type="button" onClick={clearAll}>Clear all</button>
          </div>
        ) : null}
      </section>

      <section className="transactions-panel panel" aria-label="Transactions">
        <div className="transactions-panel-header">
          <div>
            <p className="eyebrow">Transaction history</p>
            <h2>All transactions</h2>
          </div>
          <p className="transaction-count">{loading ? 'Loading…' : `${total} records`}</p>
        </div>

        {error ? (
          <div className="transaction-state panel-error" role="alert">
            <span>{error}</span>
            <button className="text-button" type="button" onClick={() => setReloadCount((count) => count + 1)}>Try again</button>
          </div>
        ) : loading ? (
          <div className="table-skeleton" aria-label="Loading transactions">
            {[1, 2, 3, 4, 5].map((row) => <div className="skeleton" key={row} />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="transaction-state">
            <h3>No transactions found</h3>
            <p className="empty-copy">Try adjusting your search or filters.</p>
            {activeFilters.length > 0 ? <button className="text-button" type="button" onClick={clearAll}>Clear all filters</button> : null}
          </div>
        ) : (
          <div className="transaction-table-wrap">
            <table className="transactions-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.field} scope="col">
                      <button
                        className={`sort-button ${sortBy === column.field ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => changeSort(column.field)}
                        aria-label={`Sort by ${column.label}`}
                      >
                        {column.label} <SortIndicator active={sortBy === column.field} direction={sortOrder} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td data-label="Date">{formatDate(transaction.date)}</td>
                    <td data-label="ID">#{transaction.id}</td>
                    <td data-label="User"><span className="user-id">{transaction.user_id}</span></td>
                    <td data-label="Category"><span className={`category-tag is-${transaction.category.toLowerCase()}`}>{transaction.category}</span></td>
                    <td data-label="Status"><span className={`status-pill is-${transaction.status.toLowerCase()}`}>{transaction.status}</span></td>
                    <td data-label="Amount" className={`table-amount is-${transaction.category.toLowerCase()}`}>{formatCurrency(transaction.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && total > 0 ? (
          <div className="pagination">
            <p>Showing {firstItem}–{lastItem} of {total}</p>
            <div className="pagination-controls">
              <button className="pagination-button" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page">
                <ChevronLeft size={17} /> Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button className="pagination-button" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page">
                Next <ChevronRight size={17} />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
