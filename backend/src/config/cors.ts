// backend/src/config/cors.ts
import { CorsOptions } from 'cors';
import { config } from './environment';

export const corsOptions: CorsOptions = {
  origin: config.cors.origin,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};