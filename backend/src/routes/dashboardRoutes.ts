import { Request, Router } from 'express';
import { requireAuthentication } from '../middleware/authenticate.js';
import { TransactionModel } from '../models/transaction.js';

const DEFAULT_RECENT_LIMIT = 5;
const MAX_RECENT_LIMIT = 25;
const transactionProjection = { _id: 0, id: 1, date: 1, amount: 1, category: 1, status: 1, user_id: 1, user_profile: 1 };

class QueryValidationError extends Error {}

function parseRecentLimit(request: Request): number {
  const value = request.query.limit;
  if (value === undefined || value === '') {
    return DEFAULT_RECENT_LIMIT;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new QueryValidationError(`limit must be an integer between 1 and ${MAX_RECENT_LIMIT}.`);
  }

  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_RECENT_LIMIT) {
    throw new QueryValidationError(`limit must be an integer between 1 and ${MAX_RECENT_LIMIT}.`);
  }

  return limit;
}

interface SummaryResult {
  revenue: number;
  expenses: number;
  balance: number;
  savings: number;
}

interface OverviewResult {
  month: string;
  revenue: number;
  expenses: number;
}

export const dashboardRouter = Router();

dashboardRouter.use(requireAuthentication);

dashboardRouter.get('/summary', async (_request, response, next) => {
  try {
    const [summary] = await TransactionModel.aggregate<SummaryResult>([
      {
        $group: {
          _id: null,
          revenue: { $sum: { $cond: [{ $eq: ['$category', 'Revenue'] }, '$amount', 0] } },
          expenses: { $sum: { $cond: [{ $eq: ['$category', 'Expense'] }, '$amount', 0] } },
          paidRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$category', 'Revenue'] }, { $eq: ['$status', 'Paid'] }] },
                '$amount',
                0,
              ],
            },
          },
          paidExpenses: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$category', 'Expense'] }, { $eq: ['$status', 'Paid'] }] },
                '$amount',
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          revenue: 1,
          expenses: 1,
          balance: { $subtract: ['$revenue', '$expenses'] },
          savings: { $subtract: ['$paidRevenue', '$paidExpenses'] },
        },
      },
    ]).exec();

    response.status(200).json({ data: summary ?? { revenue: 0, expenses: 0, balance: 0, savings: 0 } });
  } catch (error: unknown) {
    next(error);
  }
});

dashboardRouter.get('/overview', async (_request, response, next) => {
  try {
    const data = await TransactionModel.aggregate<OverviewResult>([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' },
          },
          month: {
            $first: {
              $dateToString: { format: '%b %Y', date: '$date', timezone: 'UTC' },
            },
          },
          revenue: { $sum: { $cond: [{ $eq: ['$category', 'Revenue'] }, '$amount', 0] } },
          expenses: { $sum: { $cond: [{ $eq: ['$category', 'Expense'] }, '$amount', 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: 1, revenue: 1, expenses: 1 } },
    ]).exec();

    response.status(200).json({ data });
  } catch (error: unknown) {
    next(error);
  }
});

dashboardRouter.get('/recent', async (request, response, next) => {
  try {
    const limit = parseRecentLimit(request);
    const data = await TransactionModel.find({})
      .select(transactionProjection)
      .sort({ date: -1 })
      .limit(limit)
      .lean()
      .exec();

    response.status(200).json({ data, limit });
  } catch (error: unknown) {
    if (error instanceof QueryValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});
