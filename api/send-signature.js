export default async function handler(req, res) {
    // 1. Solo aceptar peticiones POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        // 2. Obtener datos del cuerpo de la petición
        const { empresa, nombreCompleto, email, fecha } = req.body;
        const adminEmail = 'robertomacedonorato@gmail.com';
        const apiKey = process.env.BOLDSIGN_API_KEY;

        // 3. Validar que la API Key existe
        if (!apiKey) {
            return res.status(500).json({ error: 'API Key de BoldSign no configurada en el servidor.' });
        }

        // --- Crear un PDF simple pero válido en Base64 ---
        // Este es un PDF de una página con texto de ejemplo.
        // La librería 'pdf-lib' sería más robusta, pero lo mantenemos simple por ahora.
        const pdfText = `
            CERTIFICADO DE FINALIZACIÓN
            Curso Residentes Netser

            El presente certifica que: ${nombreCompleto}
            Ha completado el curso en representación de: ${empresa}
            Fecha de finalización: ${fecha}

            Firma Digital: ___________________
        `;
        // Convertir el texto a Base64. NOTA: Para producción, es mejor generar un PDF real.
        const pdfBase64 = Buffer.from(pdfText).toString('base64');
        // ------------------------------------------------

        // 4. Construir el cuerpo de la petición según la documentación de BoldSign
        const requestBody = {
            Title: `Certificado - ${nombreCompleto}`,
            Message: `Hola ${nombreCompleto}, por favor completa tu firma digital para certificar la finalización del curso.`,
            Signers: [
                {
                    Name: nombreCompleto,
                    EmailAddress: email,
                    SignerOrder: 1,
                    // --- CORRECCIÓN PRINCIPAL: FormFields debe estar dentro del objeto Signer ---
                    FormFields: [
                        {
                            Id: "Signature",
                            FieldType: "Signature",
                            PageNumber: 1,
                            Bounds: {
                                X: 100,
                                Y: 300,
                                Width: 200,
                                Height: 50
                            }
                        }
                    ]
                }
            ],
            CC: [{ EmailAddress: adminEmail }],
            Files: [
                {
                    Name: `certificado_${Date.now()}.pdf`,
                    DocumentBase64: pdfBase64
                }
            ]
        };

        // 5. Enviar la petición a la API de BoldSign
        const response = await fetch('https://api.boldsign.com/v1/document/send', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // 6. Procesar la respuesta
        const data = await response.json();

        if (!response.ok) {
            // Loggear el error detallado para depuración
            console.error('Error detallado de BoldSign:', JSON.stringify(data, null, 2));
            return res.status(response.status).json({
                error: 'Error al comunicarse con BoldSign',
                details: data
            });
        }

        // 7. Respuesta exitosa
        console.log('Documento creado exitosamente:', data.documentId);
        return res.status(200).json({
            success: true,
            message: `Solicitud de firma enviada a ${email}. Revisa tu bandeja de entrada.`,
            documentId: data.documentId
        });

    } catch (error) {
        // Capturar cualquier error inesperado (de red, etc.)
        console.error('Error interno del servidor:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}
