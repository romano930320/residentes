import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    try {
        const result = await pool.query('SELECT NOW() as hora_actual');
        res.json({ 
            success: true, 
            message: '✅ Conexión exitosa a Neon',
            hora: result.rows[0].hora_actual
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
