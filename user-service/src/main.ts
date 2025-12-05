import Fastify, { FastifyInstance } from 'fastify';
import userRoutes from './routes/user.routes';
import dotenv from 'dotenv';

// -------------------------------------------------------
// Load environment variables (Docker already passes the .env)
// -------------------------------------------------------
dotenv.config();

// -------------------------------------------------------
// DEBUG: Show loaded variables
// -------------------------------------------------------
console.log("📦 Loaded environment variables:");
console.log({
    USER_SERVICE_PORT: process.env.USER_SERVICE_PORT,
    NODE_ENV: process.env.NODE_ENV,
});

// -------------------------------------------------------
// DEBUG: Runtime information
// -------------------------------------------------------
console.log("🧠 Runtime information:");
console.log({
    dirname: __dirname,
    cwd: process.cwd(),
    nodeVersion: process.version,
    platform: process.platform
});

// -------------------------------------------------------
// Create Fastify server
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
// Register routes
// -------------------------------------------------------
app.register(userRoutes, { prefix: '/users' });
console.log("📚 Registered routes: /users/*");

// -------------------------------------------------------
// Final service port
// -------------------------------------------------------
const PORT = process.env.USER_SERVICE_PORT
    ? Number(process.env.USER_SERVICE_PORT)
    : 5002;

console.log(`🚀 Final port the service will use: ${PORT}`);

// -------------------------------------------------------
// Listener
// -------------------------------------------------------
app.listen({ port: PORT, host: "0.0.0.0" })
    .then(() => {
        console.log(`✅ User service listening on http://0.0.0.0:${PORT}`);
    })
    .catch((err) => {
        console.error("🔥 ERROR starting the server:");
        console.error(err);
        process.exit(1);
    });
