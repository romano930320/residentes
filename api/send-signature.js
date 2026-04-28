export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { empresa, nombreCompleto, email, fecha } = req.body;
        const adminEmail = 'robertomacedonorato@gmail.com';
        const apiKey = process.env.BOLDSIGN_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API Key no configurada' });
        }

        // Contenido del PDF
        const pdfText = `
CERTIFICADO CURSO RESIDENTES NETSER
========================================

Certifica que: ${nombreCompleto}

Ha completado el curso "Residentes Netser"

Empresa: ${empresa}
Fecha: ${fecha}

Firma Digital - ExamenNetser
        `.trim();

        const pdfBase64 = Buffer.from(pdfText).toString('base64');

        const response = await fetch('https://api.boldsign.com/v1/document/send', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Title: `Certificado - ${nombreCompleto}`,
                Message: `Hola ${nombreCompleto}, completa tu firma digital.`,
                Signers: [{ Name: nombreCompleto, EmailAddress: email, SignerOrder: 1 }],
                CC: [{ EmailAddress: adminEmail }],
                Files: [{
                    Name: `certificado_${Date.now()}.pdf`,
                    DocumentBase64: pdfBase64
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('BoldSign error:', data);
            return res.status(500).json({ error: data.errors?.[0]?.message || 'Error en BoldSign' });
        }

        res.json({ success: true, message: `Correo enviado a ${email}`, documentId: data.documentId });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}
