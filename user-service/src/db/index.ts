import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from "path";


// Busca el .env en la carpeta deployments
//dotenv.config({ path: path.resolve(__dirname, "../../deployments/.env") } as dotenv.DotenvConfigOptions);

dotenv.config(); // Cargar variables de entorno del sistema

export const pool : Pool = new Pool({
    host: process.env.USER_DB_HOST ?? "user_db", // <-- usar env con fallback
    port: Number(process.env.USER_DB_PORT),
    database: process.env.USER_DB_NAME,
    user: process.env.USER_DB_USER,
    password: process.env.USER_DB_PASS
});

pool.on('error', (err : Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

/*Esto te permite usar pool.query() en tu service para CRUD.*/