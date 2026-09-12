import express from 'express';
import { connectToDatabase } from './config/database.js';

const app = express();
const port = Number(process.env.PORT) || 3001;

async function startServer() {
  await connectToDatabase();

  app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error('Unable to start backend server:', error);
  process.exitCode = 1;
});
