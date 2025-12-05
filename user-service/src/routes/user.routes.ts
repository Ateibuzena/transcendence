import { FastifyInstance } from 'fastify';
import * as userController from '../controllers/user.controller';
    
export default async function userRoutes(fastify: FastifyInstance, options: any) {
    fastify.get('/', userController.getUsers);
    fastify.post('/', userController.createUser);
}