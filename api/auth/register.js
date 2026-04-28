import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { first_name, last_name, email, password, profile, country } = req.body;

        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password, profile, country) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, email, profile`,
            [first_name, last_name, email, hashedPassword, profile, country]
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
}
