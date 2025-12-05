import Fastify, { FastifyInstance } from 'fastify';
import userRoutes from './routes/user.routes';
import dotenv from 'dotenv';

// -------------------------------------------------------
// Cargar variables de entorno (Docker ya pasa la .env)
// -------------------------------------------------------
dotenv.config();

// -------------------------------------------------------
// DEBUG: Mostrar variables cargadas
// -------------------------------------------------------
console.log("📦 Variables de entorno cargadas:");
console.log({
    USER_SERVICE_PORT: process.env.USER_SERVICE_PORT,
    NODE_ENV: process.env.NODE_ENV,
});

// -------------------------------------------------------
// DEBUG: Información del runtime
// -------------------------------------------------------
console.log("🧠 Información de ejecución:");
console.log({
    dirname: __dirname,
    cwd: process.cwd(),
    nodeVersion: process.version,
    platform: process.platform
});

// -------------------------------------------------------
// Crear servidor Fastify
// -------------------------------------------------------
const app: FastifyInstance = Fastify({
    logger: {
        level: "debug",
        transport: {
            target: "pino-pretty",
            options: { colorize: true }
        }
    }
});

// -------------------------------------------------------
// Registro de rutas
// -------------------------------------------------------
app.register(userRoutes, { prefix: '/users' });
console.log("📚 Rutas registradas: /users/*");

// -------------------------------------------------------
// Puerto final del servicio
// -------------------------------------------------------
const PORT = process.env.USER_SERVICE_PORT
    ? Number(process.env.USER_SERVICE_PORT)
    : 5002;

console.log(`🚀 Puerto final que usará el servicio: ${PORT}`);

// -------------------------------------------------------
// Listener
// -------------------------------------------------------
app.listen({ port: PORT, host: "0.0.0.0" })
    .then(() => {
        console.log(`✅ User service escuchando en http://0.0.0.0:${PORT}`);
    })
    .catch((err) => {
        console.error("🔥 ERROR arrancando el servidor:");
        console.error(err);
        process.exit(1);
    });
