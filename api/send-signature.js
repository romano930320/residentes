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

        // Texto del PDF
        const pdfText = `CERTIFICADO CURSO RESIDENTES NETSER
Certifica que: ${nombreCompleto}
Empresa: ${empresa}
Fecha: ${fecha}
Firma Digital: ___________________`;
        
        const pdfBase64 = Buffer.from(pdfText).toString('base64');

        const requestBody = {
            Title: `Certificado - ${nombreCompleto}`,
            Message: `Hola ${nombreCompleto}, firma para certificar el curso.`,
            Signers: [
                {
                    Name: nombreCompleto,
                    EmailAddress: email,
                    SignerOrder: 1,
                    FormFields: [
                        {
                            Id: "signature",
                            FieldType: "Signature",
                            PageNumber: 1,
                            Bounds: { X: 100, Y: 300, Width: 200, Height: 50 }
                        }
                    ]
                }
            ],
            CC: [{ EmailAddress: adminEmail }],
            Files: [{ Name: `certificado.pdf`, DocumentBase64: pdfBase64 }]
        };

        console.log('Enviando a BoldSign:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://api.boldsign.com/v1/document/send', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // Loggear la respuesta completa de BoldSign
        console.log('Respuesta BoldSign:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            // Devolver el error específico de BoldSign
            return res.status(response.status).json({ 
                error: 'BoldSign error', 
                details: data,
                status: response.status
            });
        }

        res.json({ success: true, message: `Correo enviado a ${email}` });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}
