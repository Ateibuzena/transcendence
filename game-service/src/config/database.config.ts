// src/config/database.config.ts
import { config } from 'dotenv';

config();

export const databaseConfig = {
  host: process.env.GAME_DB_HOST || 'localhost',
  port: parseInt(process.env.GAME_DB_PORT || '5432', 10),
  database: process.env.GAME_DB_NAME || 'game_db',
  user: process.env.GAME_DB_USER || 'postgres',
  password: process.env.GAME_DB_PASS || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};