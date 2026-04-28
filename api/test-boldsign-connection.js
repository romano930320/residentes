export default async function handler(req, res) {
    try {
        const apiKey = process.env.BOLDSIGN_API_KEY;
        
        if (!apiKey) {
            return res.json({ 
                success: false, 
                error: 'BOLDSIGN_API_KEY no configurada en Vercel' 
            });
        }
        
        // Probar conexión simple (listar documentos)
        const response = await fetch('https://api.boldsign.com/v1/document/list', {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        res.json({
            success: response.ok,
            status: response.status,
            api_key_valida: response.status === 200,
            mensaje: response.ok ? '✅ API Key válida' : '❌ API Key inválida',
            detalle: data
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
}
