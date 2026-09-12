import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { resolve } from 'node:path';

dotenv.config({
  path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')],
});

function getMongoUri(): string {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured before connecting to MongoDB.');
  }

  return mongoUri;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  return mongoose.connect(getMongoUri());
}

export async function disconnectFromDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
