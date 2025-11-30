import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import db from './config/database';
import redis from './config/redis';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// Initialize Redis
redis.connect().catch(console.error);

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await redis.client.ping();
    res.json({
      status: 'ok',
      database: 'connected',
      redis: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: (error as Error).message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
