import Fastify, { FastifyInstance } from 'fastify';
//import formbody from 'fastify-formbody';
import userRoutes from './routes/user.routes';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// -------------------------------------------------------
// DEBUG: RUTA ESPERADA PARA EL .env DENTRO DEL CONTENEDOR
// -------------------------------------------------------
const expectedEnvPath = path.resolve(__dirname, "../.env");
console.log("🔍 Buscando .env en:", expectedEnvPath);

// -------------------------------------------------------
// DEBUG: ¿EL ARCHIVO .env EXISTE?
// -------------------------------------------------------
if (fs.existsSync(expectedEnvPath)) {
    console.log("✅ .env encontrado en:", expectedEnvPath);
} else {
    console.log("❌ .env NO encontrado en:", expectedEnvPath);
}

// -------------------------------------------------------
// Cargar dotenv
// -------------------------------------------------------
const dotenvResult = dotenv.config({
    path: expectedEnvPath
});

if (dotenvResult.error) {
    console.error("❌ Error cargando .env:", dotenvResult.error);
} else {
    console.log("✅ Variables .env cargadas correctamente");
}

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
// Crear servidor con Fastify en modo verbose
// -------------------------------------------------------
const app: FastifyInstance = Fastify({
    logger: {
        level: "debug",
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true
            }
        }
    }
});

//app.register(formbody);

// -------------------------------------------------------
// Registro de rutas
// -------------------------------------------------------
app.register(userRoutes, { prefix: '/users' });
console.log("📚 Rutas registradas: /users/*");

// -------------------------------------------------------
// Puerto final usado por el servidor
// -------------------------------------------------------
const PORT = process.env.USER_SERVICE_PORT
    ? Number(process.env.USER_SERVICE_PORT)
    : 5002;

console.log(`🚀 Puerto final que usará el servicio: ${PORT}`);

// -------------------------------------------------------
// Listener con captura de errores
// -------------------------------------------------------
app.listen(
    { port: PORT, host: "0.0.0.0" }
).then(() => {
    console.log(`✅ User service escuchando en http://0.0.0.0:${PORT}`);
}).catch((err) => {
    console.error("🔥 ERROR arrancando el servidor:");
    console.error(err);
    process.exit(1);
});
