import Fastify from "fastify";
import cors from "@fastify/cors";

import mainRoutes from "./routes/main.js"

const config = {
            logger : true, };

const   fastify = Fastify(config);

const cors_config = {
            origin : true, };

await fastify.register(cors, cors_config);

const start = async () => 
{
    try
    {
        const listen_config = {
                    port: 3000,
                    host: "0.0.0.0", }; //hace que el servidor escuche todas las interfaces de red de tu máquina, no solo localhost.
        await fastify.register(mainRoutes);
        await fastify.listen(listen_config);
        console.log("✅ Servidor corriendo en http://localhost:3000");
    }
    catch (server_error)
    {
        fastify.log.error(server_error);
        process.exit(1) //future error server status
    }
};

start();