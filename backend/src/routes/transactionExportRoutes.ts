import { Request, Router } from 'express';
import { requireAuthentication } from '../middleware/authenticate.js';
import { TransactionModel } from '../models/transaction.js';
import { parseTransactionQuery, QueryValidationError } from './transactionRoutes.js';

const allowedColumns = ['id', 'date', 'amount', 'category', 'status', 'user_id', 'user_profile'] as const;
type ExportColumn = (typeof allowedColumns)[number];

function readSingleQueryValue(request: Request, key: string): string | undefined {
  const value = request.query[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new QueryValidationError(`${key} must be a single value.`);
  }
  return value.trim();
}

function parseColumns(request: Request): ExportColumn[] {
  const requested = readSingleQueryValue(request, 'columns');
  if (!requested) {
    return [...allowedColumns];
  }

  const columns = requested.split(',').map((column) => column.trim());
  if (
    columns.length === 0 ||
    columns.some((column) => !allowedColumns.includes(column as ExportColumn)) ||
    new Set(columns).size !== columns.length
  ) {
    throw new QueryValidationError(`columns must contain unique allowed fields: ${allowedColumns.join(', ')}.`);
  }

  return columns as ExportColumn[];
}

function escapeCsvValue(value: unknown): string {
  const text = value instanceof Date ? value.toISOString() : String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const transactionExportRouter = Router();

transactionExportRouter.get('/export', requireAuthentication, async (request, response, next) => {
  try {
    const scope = readSingleQueryValue(request, 'scope') ?? 'current';
    if (scope !== 'current' && scope !== 'all') {
      throw new QueryValidationError('scope must be current or all.');
    }

    const columns = parseColumns(request);
    const filter = scope === 'current' ? parseTransactionQuery(request).filter : {};
    const projection = Object.fromEntries(columns.map((column) => [column, 1]));

    response.status(200);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    response.write(`${columns.join(',')}\r\n`);

    const cursor = TransactionModel.find(filter)
      .select({ _id: 0, ...projection })
      .sort({ date: -1 })
      .lean()
      .cursor();

    for await (const transaction of cursor) {
      const row = columns.map((column) => escapeCsvValue((transaction as Record<string, unknown>)[column]));
      response.write(`${row.join(',')}\r\n`);
    }

    response.end();
  } catch (error: unknown) {
    if (error instanceof QueryValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});
