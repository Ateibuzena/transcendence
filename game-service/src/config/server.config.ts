// src/config/server.config.ts
import { config } from 'dotenv';

config();

export const serverConfig = {
  port: parseInt(process.env.PORT || '5004', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret',
    expiresIn: '7d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  socketio: {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    },
    transports: ['websocket', 'polling']
  }
};