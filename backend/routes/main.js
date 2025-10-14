import { homeData } from "../data/homeData.js";
import { dataInfo } from "../data/dataInfo.js";

export default async function mainRoutes(fastify, options)
{
    fastify.get("/", async (requestAnimationFrame, reply) =>
    {
        return (dataInfo);
    })
    fastify.get("/data", async (requestAnimationFrame, reply) =>
    {
        return (homeData);
    })

}