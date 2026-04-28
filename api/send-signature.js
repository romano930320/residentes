export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { empresa, nombreCompleto, email, fecha } = req.body;
        const adminEmail = 'robertomacedonorato@gmail.com';
        const apiKey = process.env.BOLDSIGN_API_KEY;

        // PDF mínimo válido
        const pdfBase64 = "JVBERi0xLjQKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9Db250ZW50cyA0IDAgUj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCA0Mj4+CnN0cmVhbQpCVC9GMiAxMiBUZiA5MCA3MjAgVGQoQ2VydGlmaWNhZG8gQ3Vyc28gUmVzaWRlbnRlcykganovCi9GMSAxMiBUZiA5MCA3MDAgVGQoRmlybWFkbzogJXMgJXMpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKdHJhaWxlcgo8PC9Sb290IDEgMCBSL1NpemUgNT4+CnN0YXJ0eHJlZgoyMjUKJSVFT0Y=";

        const response = await fetch('https://api.boldsign.com/v1/document/send', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Title: `Certificado - ${nombreCompleto}`,
                Message: `Hola ${nombreCompleto}, completa tu firma.`,
                Signers: [{ Name: nombreCompleto, EmailAddress: email, SignerOrder: 1 }],
                CC: [{ EmailAddress: adminEmail }],
                Files: [{ Name: `certificado.pdf`, DocumentBase64: pdfBase64 }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: data.message || 'Error en BoldSign' });
        }

        res.json({ success: true, message: `Correo enviado a ${email}`, documentId: data.documentId });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}
