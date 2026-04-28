import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Configuración de la base de datos para Vercel
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Esto es importante para Neon en entornos serverless
    }
});

export default async function handler(req, res) {
    // Permitir solo peticiones POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { email, password } = req.body;

        // Validar que se recibieron los datos
        if (!email || !password) {
            return res.status(400).json({ error: 'Faltan credenciales' });
        }

        // Buscar el usuario en la base de datos
        const result = await pool.query(
            'SELECT id, first_name, last_name, email, password, profile FROM users WHERE email = $1',
            [email.toLowerCase()] // Asegurar que el email se compara en minúsculas
        );

        // Si el usuario no existe
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];

        // Comparar la contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Crear el token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                first_name: user.first_name, 
                last_name: user.last_name,
                profile: user.profile
            },
            process.env.JWT_SECRET || 'examnetser_secret_2024',
            { expiresIn: '7d' }
        );

        // Enviar respuesta exitosa
        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                profile: user.profile
            }
        });

    } catch (error) {
        // Loggear el error para depuración (Vercel lo mostrará en los logs)
        console.error('Error en login:', error);
        
        // Enviar un error genérico al cliente
        return res.status(500).json({ 
            error: 'Error interno del servidor. Revisa los logs de Vercel.' 
        });
    }
}
