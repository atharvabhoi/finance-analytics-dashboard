import type {
  DashboardSummary,
  DataResponse,
  LoginResponse,
  MeResponse,
  MonthlyOverview,
  Transaction,
  User,
} from '../types/api';

export const AUTH_TOKEN_STORAGE_KEY = 'finance-dashboard.auth-token';

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | undefined;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | undefined): void {
  unauthorizedHandler = handler;
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string | null;
  skipAuth?: boolean;
  skipUnauthorizedHandler?: boolean;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = options.token === undefined ? getStoredToken() : options.token;
  if (token && !options.skipAuth) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !options.skipUnauthorizedHandler) {
      unauthorizedHandler?.();
    }

    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Request failed.';
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
    skipUnauthorizedHandler: true,
  });
}

export async function fetchCurrentUser(token: string): Promise<User> {
  const payload = await apiRequest<MeResponse>('/api/auth/me', {
    token,
    skipUnauthorizedHandler: true,
  });
  return payload.user;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const payload = await apiRequest<DataResponse<DashboardSummary>>('/api/dashboard/summary');
  return payload.data;
}

export async function fetchDashboardOverview(): Promise<MonthlyOverview[]> {
  const payload = await apiRequest<DataResponse<MonthlyOverview[]>>('/api/dashboard/overview');
  return payload.data;
}

export async function fetchRecentTransactions(limit = 5): Promise<Transaction[]> {
  const payload = await apiRequest<DataResponse<Transaction[]>>(`/api/dashboard/recent?limit=${limit}`);
  return payload.data;
}
