import { User } from '../models/user.model';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as userService from '../services/user.service';



export const getUsers = async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
    const users : User[] = await userService.getAllUsers();
    res.send(users);
};

export const createUser = async (req: FastifyRequest<{ Body: { username: string; email: string } }>, res: FastifyReply): Promise<void> => {
    const username : string = req.body.username;
    const email : string = req.body.email;
    const user : User = await userService.createUser(username, email);
    res.code(201).send(user);
};
