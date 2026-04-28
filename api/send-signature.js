import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }
    try {
        const { empresa, nombreCompleto, email, fecha } = req.body;
        const adminEmail = 'robertomacedonorato@gmail.com'; // FIX 1: sin formato Markdown
        const apiKey = process.env.BOLDSIGN_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API Key no configurada' });
        }

        // FIX 2: Generar un PDF real con pdf-lib
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 400]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        page.drawText('CERTIFICADO CURSO RESIDENTES NETSER', {
            x: 50, y: 350, size: 16, font: boldFont, color: rgb(0, 0, 0)
        });
        page.drawText(`Certifica que: ${nombreCompleto}`, {
            x: 50, y: 310, size: 12, font
        });
        page.drawText(`Empresa: ${empresa}`, {
            x: 50, y: 285, size: 12, font
        });
        page.drawText(`Fecha: ${fecha}`, {
            x: 50, y: 260, size: 12, font
        });
        page.drawText('Firma Digital:', {
            x: 50, y: 220, size: 12, font
        });

        const pdfBytes = await pdfDoc.save();
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

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
                            Id: 'signature',
                            FieldType: 'Signature',
                            PageNumber: 1,
                            Bounds: { X: 100, Y: 300, Width: 200, Height: 50 }
                        }
                    ]
                }
            ],
            CC: [{ EmailAddress: adminEmail }],
            Files: [{ Name: 'certificado.pdf', FileBase64: pdfBase64 }] // FIX 3: FileBase64 no DocumentBase64
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
        console.log('Respuesta BoldSign:', JSON.stringify(data, null, 2));

        if (!response.ok) {
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
