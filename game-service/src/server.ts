// src/server.ts
import { buildApp } from './app';
import { serverConfig } from './config/server.config';

async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: serverConfig.port,
      host: serverConfig.host
    });

    console.log(`
    🚀 Servidor Pong iniciado correctamente
    
    📍 HTTP: http://${serverConfig.host}:${serverConfig.port}
    🔌 WebSocket: ws://${serverConfig.host}:${serverConfig.port}
    🌍 Entorno: ${serverConfig.nodeEnv}
    `);

  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

start();