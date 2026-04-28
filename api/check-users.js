import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM evaluaciones_tecnicas.users');
        res.json({ 
            success: true, 
            message: '✅ Conexión exitosa',
            usuarios_registrados: parseInt(result.rows[0].count)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
