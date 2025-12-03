// src/api/routes/index.ts
import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes';
import { matchRoutes } from './match.routes';
import { userRoutes } from './user.routes';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Registrar todas las rutas bajo /api
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(matchRoutes, { prefix: '/api/matches' });
  await app.register(userRoutes, { prefix: '/api/users' });
}