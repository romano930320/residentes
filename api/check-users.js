import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    try {
        // Probar conexión básica
        const now = await pool.query('SELECT NOW() as hora');
        
        // Listar todas las tablas en el esquema public
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        // Verificar específicamente la tabla users
        const usersCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        // Si existe, contar usuarios
        let userCount = null;
        if (usersCheck.rows[0].exists) {
            const countResult = await pool.query('SELECT COUNT(*) FROM public.users');
            userCount = parseInt(countResult.rows[0].count);
        }
        
        res.json({
            success: true,
            hora: now.rows[0].hora,
            tablas_en_public: tables.rows.map(r => r.table_name),
            existe_tabla_users: usersCheck.rows[0].exists,
            cantidad_usuarios: userCount,
            database_url_configurada: !!process.env.DATABASE_URL
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        });
    }
}
