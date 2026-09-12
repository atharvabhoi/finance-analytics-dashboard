import cors from 'cors';
import express from 'express';
import { connectToDatabase } from './config/database.js';
import { corsOrigin } from './config/environment.js';
import { authRouter } from './routes/authRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { transactionExportRouter } from './routes/transactionExportRoutes.js';
import { transactionRouter } from './routes/transactionRoutes.js';

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '16kb' }));
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/transactions', transactionExportRouter);
app.use('/api/transactions', transactionRouter);

app.use((_request, response) => {
  response.status(404).json({ message: 'Route not found.' });
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('Unhandled request error:', error);
    response.status(500).json({ message: 'An unexpected error occurred.' });
  },
);

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
