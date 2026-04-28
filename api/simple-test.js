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
            usuarios: result.rows[0].count 
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
}
