import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import db from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: (error as Error).message,
    });
  }
});

// API routes placeholder
app.get('/api/v1', (_req, res) => {
  res.json({
    name: 'Housler Pervichka API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      offers: '/api/v1/offers',
      complexes: '/api/v1/complexes',
      filters: '/api/v1/filters',
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📍 API: http://localhost:${PORT}/api/v1`);
});

export default app;
