// src/plugins/postgres.plugin.ts
import { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import pg from 'pg';
import { databaseConfig } from '../config/database.config';

const { Pool } = pg;

declare module 'fastify' {
  interface FastifyInstance {
    pg: pg.Pool;
  }
}

const postgresPlugin: FastifyPluginAsync = async (fastify) => {
  const pool = new Pool(databaseConfig);

  // Test connection
  try {
    const client = await pool.connect();
    fastify.log.info('PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    fastify.log.error(`Failed to connect to PostgreSQL: ${err}`);
    throw err;
  }

  // Add pool to fastify instance
  fastify.decorate('pg', pool);

  // Close pool on app close
  fastify.addHook('onClose', async (instance) => {
    await instance.pg.end();
    instance.log.info('PostgreSQL connection pool closed');
  });
};

export default fastifyPlugin(postgresPlugin);