export interface User {
  id: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

export interface DashboardSummary {
  revenue: number;
  expenses: number;
  balance: number;
  savings: number;
}

export interface MonthlyOverview {
  month: string;
  revenue: number;
  expenses: number;
}

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  category: 'Revenue' | 'Expense';
  status: 'Paid' | 'Pending';
  user_id: string;
  user_profile: string;
}

export type TransactionSortBy = 'id' | 'date' | 'amount' | 'category' | 'status' | 'user_id';
export type SortOrder = 'asc' | 'desc';

export interface TransactionQuery {
  search?: string;
  category?: Transaction['category'];
  status?: Transaction['status'];
  user?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  sortBy?: TransactionSortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface TransactionListResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const transactionExportColumns = [
  'id',
  'date',
  'amount',
  'category',
  'status',
  'user_id',
  'user_profile',
] as const;

export type TransactionExportColumn = (typeof transactionExportColumns)[number];
export type TransactionExportScope = 'current' | 'all';

export interface TransactionExportQuery extends Omit<TransactionQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'> {
  scope: TransactionExportScope;
  columns: TransactionExportColumn[];
}

export interface ApiMessage {
  message: string;
}

export interface DataResponse<T> {
  data: T;
}
