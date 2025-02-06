require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const token = process.env.TOKEN;
const phoneId = process.env.PHONE_ID;

const responses = {
    "hola": "¡Hola! Bienvenido a nuestra tienda. ¿Cómo podemos ayudarte? \n1️⃣ Ver productos \n2️⃣ Hacer un pedido \n3️⃣ Contactar a un asesor",
    "1": "Aquí tienes nuestro catálogo: [enlace_a_tu_catalogo]",
    "2": "Para hacer un pedido, envíanos el nombre del producto y la cantidad.",
    "3": "Te ponemos en contacto con un asesor. Espera un momento...",
};

// Ruta principal para verificar que el bot está corriendo
app.get("/", (req, res) => {
    res.send("Bot de WhatsApp corriendo...");
});

// Webhook para recibir mensajes
app.post("/webhook", async (req, res) => {
    console.log("Evento recibido:", JSON.stringify(req.body, null, 2));

    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Verificar que hay un mensaje válido
    if (!message || !message.text) {
        return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text.body.toLowerCase();

    // Verificar si el mensaje es del mismo bot (evita respuestas en bucle)
    if (from === phoneId) {
        return res.sendStatus(200);
    }

    // Obtener respuesta predefinida o mensaje por defecto
    const responseText = responses[text] || "Lo siento, no entendí eso. Escribe *hola* para ver opciones.";

    await sendMessage(from, responseText);
    
    res.sendStatus(200);
});

// Función para enviar mensajes
async function sendMessage(to, text) {
    try {
        const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
        await axios.post(
            url,
            {
                messaging_product: "whatsapp",
                to,
                text: { body: text },
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    } catch (error) {
        console.error("Error al enviar mensaje:", error.response?.data || error.message);
    }
}

// Configurar webhook para validación de Meta
app.get("/webhook", (req, res) => {
    const verifyToken = "12345"; // Usa un token seguro y compártelo con Meta
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === verifyToken) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.listen(3000, () => console.log("Servidor corriendo en el puerto 3000"));
