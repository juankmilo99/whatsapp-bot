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

app.get("/", (req, res) => {
    res.send("Bot de WhatsApp corriendo...");
});

// Webhook para recibir mensajes
app.post("/webhook", async (req, res) => {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
        const from = message.from;
        const text = message.text?.body.toLowerCase();

        const responseText = responses[text] || "Lo siento, no entendí eso. Escribe *hola* para ver opciones.";

        await sendMessage(from, responseText);
    }
    
    res.sendStatus(200);
});

// Función para enviar mensajes
async function sendMessage(to, text) {
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
}

// Configurar webhook para validación de Meta
app.get("/webhook", (req, res) => {
    const verifyToken = "12345"; // Cambia esto por un token seguro
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
