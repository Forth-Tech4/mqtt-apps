// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const mqttClient = mqtt.connect('mqtt://192.168.54.235:1883');

mqttClient.on('connect', () => {
    console.log('Connected to Mosquitto MQTT Broker');
});

mqttClient.on('error', (err) => {
    console.error('MQTT Connection error:', err);
});

// Broadcast MQTT messages to WebSocket clients
mqttClient.on('message', (topic, message) => {
    const payload = JSON.stringify({ topic, message: message.toString() });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
            client.send(payload);
        }
    });
});

wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    ws.isAuthenticated = false;
    
    ws.on('message', (data) => {
        console.log('Received from client:', data);
        console.log('Raw message from client:', data);
        try {
            const msg = JSON.parse(data);
            console.log('Parsed message:', msg);

            // 1. Handle authentication
            if (msg.action === 'auth') {
                if (msg.username === 'kanji' && msg.password === '123') {
                    console.log('Authenticated user:', msg.username);
                    ws.isAuthenticated = true;
                    ws.send(JSON.stringify({ status: 'authenticated' }));
                    return;
                } else {
                    console.log('Invalid credentials received:', msg.username, msg.password);
                    ws.send(JSON.stringify({ error: 'Authentication failed' }));
                    ws.close();
                    return;
                }
            }

            // 2. Block other actions if not authenticated
            if (!ws.isAuthenticated) {
                ws.send(JSON.stringify({ error: 'Not authenticated' }));
                ws.close();
                return;
            }

            // 3. Handle subscribe/publish
            const { action, topic, message } = msg;
            if (action === 'subscribe') {
                mqttClient.subscribe(topic, (err) => {
                    if (err) console.error('Subscribe error:', err);
                    else console.log(`Subscribed to topic: ${topic}`);
                });
            } else if (action === 'publish') {
                mqttClient.publish(topic, message);
            }
        } catch (err) {
            console.error('Error handling WebSocket message:', err);
        }
    });


    ws.on('close', () => {
        console.log('WebSocket closed');
    });
});


server.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});
