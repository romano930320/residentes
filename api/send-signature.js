export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { empresa, nombreCompleto, email, fecha } = req.body;
        const apiKey = process.env.BOLDSIGN_API_KEY;
        const adminEmail = 'robertomacedonorato@gmail.com';

        if (!apiKey) {
            return res.status(500).json({ error: 'API Key no configurada' });
        }

        // PDF mínimo funcional con espacio para firma
        const pdfMinimo = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 100 >>
stream
BT /F1 24 Tf 100 750 Td (CERTIFICADO CURSO RESIDENTES) Tj
/F1 16 Tf 100 700 Td (Nombre: ${nombreCompleto}) Tj
/F1 16 Tf 100 670 Td (Empresa: ${empresa}) Tj
/F1 16 Tf 100 640 Td (Fecha: ${fecha}) Tj
/F1 16 Tf 100 580 Td (Firma:) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000210 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
350
%%EOF`).toString('base64');

        const requestBody = {
            Title: `Certificado - ${nombreCompleto}`,
            Message: `Hola ${nombreCompleto}, completa tu firma digital para certificar el curso.`,
            Signers: [{ 
                Name: nombreCompleto, 
                EmailAddress: email,
                SignerOrder: 1,
                FormFields: [
                    {
                        Id: "signature",
                        FieldType: "Signature",
                        PageNumber: 1,
                        Bounds: { X: 150, Y: 560, Width: 150, Height: 40 }
                    }
                ]
            }],
            CC: [{ EmailAddress: adminEmail }],
            Files: [{ 
                Name: `certificado_${Date.now()}.pdf`, 
                DocumentBase64: pdfMinimo 
            }]
        };

        const response = await fetch('https://api.boldsign.com/v1/document/send', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: 'Error en BoldSign', details: data });
        }

        res.json({ success: true, message: `Documento enviado a ${email}` });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}
