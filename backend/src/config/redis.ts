import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis connected'));

export const redis = {
  client: redisClient,
  connect: () => redisClient.connect(),
  get: (key: string) => redisClient.get(key),
  set: (key: string, value: string, options?: { EX?: number }) =>
    redisClient.set(key, value, options),
  del: (key: string) => redisClient.del(key),
};

export default redis;
