import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { logger } from './utils/logger';

import offersRoutes from './api/routes/offers.routes';
import filtersRoutes from './api/routes/filters.routes';
import complexesRoutes from './api/routes/complexes.routes';
import authRoutes from './api/routes/auth.routes';
import favoritesRoutes from './api/routes/favorites.routes';
import selectionsRoutes from './api/routes/selections.routes';
import bookingsRoutes, { operatorBookingsRouter } from './api/routes/bookings.routes';
import clientsRoutes from './api/routes/clients.routes';
import agenciesRoutes from './api/routes/agencies.routes';
import fixationsRoutes from './api/routes/fixations.routes';
import dealsRoutes from './api/routes/deals.routes';
import failuresRoutes from './api/routes/failures.routes';
import adminRoutes from './api/routes/admin.routes';
import { testConnection } from './config/database';

dotenv.config();

// Sentry initialization (before express)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1, // 10% of transactions
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration()
    ]
  });
  logger.info('Sentry initialized', { environment: process.env.NODE_ENV });
}

const app = express();
const PORT = process.env.API_PORT || 3001;

// Sentry request handler (must be first middleware)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/offers', offersRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/complexes', complexesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/selections', selectionsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/operator/bookings', operatorBookingsRouter);
app.use('/api/clients', clientsRoutes);
app.use('/api/agencies', agenciesRoutes);
app.use('/api/fixations', fixationsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/failures', failuresRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Log error with structured logger
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: _req.path,
    method: _req.method
  });

  // Capture error in Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
async function start() {
  // Check DB connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.warn('Database connection failed, starting anyway...');
  }

  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`, { port: PORT });
  });
}

start();
