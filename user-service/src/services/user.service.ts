import { pool } from '../db';
import { User } from '../models/user.model';

export const getAllUsers = async (): Promise<User[]> => {
    const res = await pool.query('SELECT id, username, email, created_at FROM users');
    return res.rows;
};

export const createUser = async (username: string, email: string): Promise<User> => {
    const res = await pool.query(
        'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id, username, email, created_at',
        [username, email]
    );
    return res.rows[0];
}