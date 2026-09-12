import { InferSchemaType, model, Schema } from 'mongoose';

export const transactionCategories = ['Revenue', 'Expense'] as const;
export const transactionStatuses = ['Paid', 'Pending'] as const;

/** The field shape supplied in `data/transactions.json`. */
export interface TransactionData {
  id: number;
  date: string;
  amount: number;
  category: (typeof transactionCategories)[number];
  status: (typeof transactionStatuses)[number];
  user_id: string;
  user_profile: string;
}

const transactionSchema = new Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'id must be an integer.',
      },
    },
    date: {
      type: Date,
      required: true,
      validate: {
        validator: (value: Date) => !Number.isNaN(value.getTime()),
        message: 'date must be a valid date.',
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: 'amount must be a finite number.',
      },
    },
    category: {
      type: String,
      required: true,
      enum: transactionCategories,
    },
    status: {
      type: String,
      required: true,
      enum: transactionStatuses,
    },
    user_id: {
      type: String,
      required: true,
      trim: true,
      match: [/^user_\d{3}$/, 'user_id must match the supplied user identifier format.'],
    },
    user_profile: {
      type: String,
      required: true,
      trim: true,
      match: [/^https?:\/\/\S+$/i, 'user_profile must be an HTTP(S) URL.'],
    },
  },
  {
    collection: 'transactions',
    timestamps: false,
    versionKey: false,
  },
);

transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ user_id: 1 });
transactionSchema.index({ user_id: 1, date: -1 });
transactionSchema.index({ category: 1, status: 1, date: -1 });

export type TransactionDocument = InferSchemaType<typeof transactionSchema>;
export const TransactionModel = model<TransactionDocument>('Transaction', transactionSchema);
