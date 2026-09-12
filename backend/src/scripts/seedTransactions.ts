import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectToDatabase, disconnectFromDatabase } from '../config/database.js';
import {
  transactionCategories,
  transactionStatuses,
  TransactionData,
  TransactionModel,
} from '../models/transaction.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(currentDirectory, '../../data/transactions.json');

function isTransactionData(value: unknown): value is TransactionData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    Number.isInteger(record.id) &&
    typeof record.date === 'string' &&
    !Number.isNaN(Date.parse(record.date)) &&
    typeof record.amount === 'number' &&
    Number.isFinite(record.amount) &&
    transactionCategories.includes(record.category as TransactionData['category']) &&
    transactionStatuses.includes(record.status as TransactionData['status']) &&
    typeof record.user_id === 'string' &&
    /^user_\d{3}$/.test(record.user_id) &&
    typeof record.user_profile === 'string' &&
    /^https?:\/\/\S+$/i.test(record.user_profile)
  );
}

async function loadTransactions(): Promise<TransactionData[]> {
  const fileContents = await readFile(dataPath, 'utf8');
  const parsed: unknown = JSON.parse(fileContents);

  if (!Array.isArray(parsed) || !parsed.every(isTransactionData)) {
    throw new Error('transactions.json does not match the required transaction dataset shape.');
  }

  const ids = new Set(parsed.map((transaction) => transaction.id));
  if (ids.size !== parsed.length) {
    throw new Error('transactions.json contains duplicate transaction ids.');
  }

  for (const transaction of parsed) {
    const validationError = new TransactionModel(transaction).validateSync();
    if (validationError) {
      throw validationError;
    }
  }

  return parsed;
}

async function seedTransactions(): Promise<void> {
  const transactions = await loadTransactions();
  await connectToDatabase();
  await TransactionModel.syncIndexes();

  const result = await TransactionModel.bulkWrite(
    transactions.map((transaction) => ({
      updateOne: {
        filter: { id: transaction.id },
        update: { $set: { ...transaction, date: new Date(transaction.date) } },
        upsert: true,
      },
    })),
    { ordered: true },
  );

  console.log(
    `Seed complete: ${transactions.length} records processed; ${result.upsertedCount} inserted; ${result.modifiedCount} updated.`,
  );
}

seedTransactions()
  .catch((error: unknown) => {
    console.error('Transaction seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromDatabase();
  });
