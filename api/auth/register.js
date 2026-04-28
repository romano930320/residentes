import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { first_name, last_name, email, password, profile, country } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario
        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password, profile, country) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, first_name, last_name, email, profile`,
            [first_name, last_name, email.toLowerCase(), hashedPassword, profile, country || 'No especificado']
        );

        return res.status(201).json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({ error: 'Error al registrar usuario' });
    }
}
