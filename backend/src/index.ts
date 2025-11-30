import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

import offersRoutes from './api/routes/offers.routes';
import filtersRoutes from './api/routes/filters.routes';
import { testConnection } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

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

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
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
    console.warn('⚠️  Database connection failed, starting anyway...');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`📦 API endpoints:`);
    console.log(`   GET /api/offers - Search offers`);
    console.log(`   GET /api/offers/:id - Get offer details`);
    console.log(`   GET /api/filters - Get available filters`);
  });
}

start();
