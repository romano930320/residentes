export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { empresa, nombreCompleto, email, fecha } = req.body;
        const adminEmail = 'robertomacedonorato@gmail.com';
        
        // Usar variable de entorno
        const apiKey = process.env.BOLDSIGN_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'BOLDSIGN_API_KEY no configurada' });
        }

        const pdfContent = `
CERTIFICADO CURSO RESIDENTES NETSER
========================================

El presente certifica que:

${nombreCompleto}

Ha completado el curso "Residentes Netser"

Empresa: ${empresa}
Fecha: ${fecha}

========================================
Firma Digital - ExamenNetser
        `;

        const response = await fetch('https://api.boldsign.com/v1/document/send', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Title: `Certificado Residentes Netser - ${nombreCompleto}`,
                Message: `Hola ${nombreCompleto}, completa tu firma digital para certificar la finalización del curso.`,
                Signers: [{ Name: nombreCompleto, EmailAddress: email, SignerOrder: 1 }],
                CC: [{ EmailAddress: adminEmail }],
                Files: [{
                    Name: `certificado_${Date.now()}.pdf`,
                    DocumentBase64: Buffer.from(pdfContent).toString('base64')
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error BoldSign:', data);
            throw new Error(data.message || 'Error en BoldSign');
        }

        res.json({ success: true, message: `Correo enviado a ${email}` });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message || 'Error al enviar correo' });
    }
}
