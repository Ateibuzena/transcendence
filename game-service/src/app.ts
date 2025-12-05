// src/app.ts
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import postgresPlugin from './plugins/postgres.plugin';
import fastifySocketIO from 'fastify-socket.io';
import { serverConfig } from './config/server.config';
import { setupSocketHandlers } from './socket/socket.handler';
import { registerRoutes } from './api/routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: serverConfig.nodeEnv === 'development' ? 'info' : 'error',
      transport: serverConfig.nodeEnv === 'development' 
        ? { target: 'pino-pretty' }
        : undefined
    }
  });

  // CORS
  await app.register(cors, {
    origin: serverConfig.cors.origin,
    credentials: serverConfig.cors.credentials
  });

  // JWT
  await app.register(jwt, {
    secret: serverConfig.jwt.secret
  });

  await app.register(postgresPlugin);


  // Socket.IO con tipado
  await app.register(fastifySocketIO, {
    cors: serverConfig.socketio.cors,
    transports: serverConfig.socketio.transports as any
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Registrar rutas REST API
  await registerRoutes(app);

  // Configurar Socket.IO después de que el servidor esté listo
  app.ready((err) => {
    if (err) throw err;

    // Configurar handlers de Socket.IO
    setupSocketHandlers((app as any).io);

    app.log.info('Socket.IO configurado correctamente');
  });

  return app;
}