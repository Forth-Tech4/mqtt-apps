const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));

// MQTT Client connection
const mqttClient = mqtt.connect('mqtt://test.mosquitto.org:1883');

mqttClient.on('connect', () => {
    console.log('Connected to Mosquitto MQTT Broker');
});

mqttClient.on('error', (err) => {
    console.error('MQTT Connection error:', err);
});

// When MQTT receives a message, broadcast to all WebSocket clients
mqttClient.on('message', (topic, message) => {
    const payload = JSON.stringify({ topic, message: message.toString() });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
});

// When a WebSocket client connects
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (data) => {
        const { action, topic, message } = JSON.parse(data);

        if (action === 'subscribe') {
            mqttClient.subscribe(topic, (err) => {
                if (err) console.error('Subscribe error:', err);
                else console.log(`Subscribed to topic: ${topic}`);
            });
        } else if (action === 'publish') {
            mqttClient.publish(topic, message);
        }
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
