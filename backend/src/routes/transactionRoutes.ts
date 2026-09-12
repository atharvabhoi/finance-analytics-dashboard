import { FilterQuery } from 'mongoose';
import { Request, Router } from 'express';
import { requireAuthentication } from '../middleware/authenticate.js';
import {
  transactionCategories,
  transactionStatuses,
  TransactionDocument,
  TransactionModel,
} from '../models/transaction.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 100;
const sortableFields = ['id', 'date', 'amount', 'category', 'status', 'user_id'] as const;
type SortableField = (typeof sortableFields)[number];

export class QueryValidationError extends Error {}

function readQueryValue(query: Request['query'], key: string): string | undefined {
  const value = query[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new QueryValidationError(`${key} must be a single value.`);
  }

  return value.trim();
}

function parsePositiveInteger(value: string | undefined, key: string, fallback: number, max?: number): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    throw new QueryValidationError(`${key} must be a positive integer.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || (max !== undefined && parsed > max)) {
    throw new QueryValidationError(
      max === undefined ? `${key} must be a positive integer.` : `${key} must be between 1 and ${max}.`,
    );
  }

  return parsed;
}

function parseAmount(value: string | undefined, key: string): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new QueryValidationError(`${key} must be a non-negative number.`);
  }

  return parsed;
}

function parseDate(value: string | undefined, key: string, inclusiveEnd = false): Date | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  const normalized = inclusiveEnd && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new QueryValidationError(`${key} must be a valid ISO date.`);
  }

  return parsed;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface TransactionQueryOptions {
  filter: FilterQuery<TransactionDocument>;
  sort: Record<string, 1 | -1>;
  page: number;
  limit: number;
}

export function parseTransactionQuery(request: Request): TransactionQueryOptions {
  const search = readQueryValue(request.query, 'search');
  const category = readQueryValue(request.query, 'category');
  const status = readQueryValue(request.query, 'status');
  const user = readQueryValue(request.query, 'user');
  const dateFrom = parseDate(readQueryValue(request.query, 'dateFrom'), 'dateFrom');
  const dateTo = parseDate(readQueryValue(request.query, 'dateTo'), 'dateTo', true);
  const minAmount = parseAmount(readQueryValue(request.query, 'minAmount'), 'minAmount');
  const maxAmount = parseAmount(readQueryValue(request.query, 'maxAmount'), 'maxAmount');
  const sortBy = readQueryValue(request.query, 'sortBy') ?? 'date';
  const sortOrder = readQueryValue(request.query, 'sortOrder') ?? 'desc';
  const page = parsePositiveInteger(readQueryValue(request.query, 'page'), 'page', DEFAULT_PAGE);
  const limit = parsePositiveInteger(readQueryValue(request.query, 'limit'), 'limit', DEFAULT_LIMIT, MAX_LIMIT);

  if (category && !transactionCategories.includes(category as (typeof transactionCategories)[number])) {
    throw new QueryValidationError('category must be Revenue or Expense.');
  }

  if (status && !transactionStatuses.includes(status as (typeof transactionStatuses)[number])) {
    throw new QueryValidationError('status must be Paid or Pending.');
  }

  if (user && !/^user_\d{3}$/.test(user)) {
    throw new QueryValidationError('user must match the user identifier format.');
  }

  if (!sortableFields.includes(sortBy as SortableField)) {
    throw new QueryValidationError(`sortBy must be one of: ${sortableFields.join(', ')}.`);
  }

  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    throw new QueryValidationError('sortOrder must be asc or desc.');
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new QueryValidationError('dateFrom must be before or equal to dateTo.');
  }

  if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
    throw new QueryValidationError('minAmount must be less than or equal to maxAmount.');
  }

  if (search && search.length > MAX_SEARCH_LENGTH) {
    throw new QueryValidationError(`search must be at most ${MAX_SEARCH_LENGTH} characters.`);
  }

  const filter: FilterQuery<TransactionDocument> = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (user) filter.user_id = user;
  if (dateFrom || dateTo) filter.date = { ...(dateFrom && { $gte: dateFrom }), ...(dateTo && { $lte: dateTo }) };
  if (minAmount !== undefined || maxAmount !== undefined) {
    filter.amount = { ...(minAmount !== undefined && { $gte: minAmount }), ...(maxAmount !== undefined && { $lte: maxAmount }) };
  }

  if (search) {
    const expression = new RegExp(escapeRegex(search), 'i');
    const criteria: FilterQuery<TransactionDocument>[] = [
      { category: expression },
      { status: expression },
      { user_id: expression },
    ];
    const numericSearch = Number(search);
    if (Number.isFinite(numericSearch)) {
      if (Number.isInteger(numericSearch) && numericSearch > 0) criteria.push({ id: numericSearch });
      if (numericSearch >= 0) criteria.push({ amount: numericSearch });
    }
    filter.$or = criteria;
  }

  return {
    filter,
    sort: { [sortBy as SortableField]: sortOrder === 'asc' ? 1 : -1 },
    page,
    limit,
  };
}

const transactionProjection = { _id: 0, id: 1, date: 1, amount: 1, category: 1, status: 1, user_id: 1, user_profile: 1 };
export const transactionRouter = Router();

transactionRouter.use(requireAuthentication);

transactionRouter.get('/', async (request, response, next) => {
  try {
    const { filter, sort, page, limit } = parseTransactionQuery(request);
    const [data, total] = await Promise.all([
      TransactionModel.find(filter)
        .select(transactionProjection)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      TransactionModel.countDocuments(filter).exec(),
    ]);

    response.status(200).json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: unknown) {
    if (error instanceof QueryValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});

transactionRouter.get('/:id', async (request, response, next) => {
  try {
    if (!request.params.id) {
      throw new QueryValidationError('id must be a positive integer.');
    }

    const id = parsePositiveInteger(request.params.id, 'id', DEFAULT_PAGE);
    const transaction = await TransactionModel.findOne({ id }).select(transactionProjection).lean().exec();

    if (!transaction) {
      response.status(404).json({ message: 'Transaction not found.' });
      return;
    }

    response.status(200).json({ data: transaction });
  } catch (error: unknown) {
    if (error instanceof QueryValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});
