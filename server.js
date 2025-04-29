const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));

// MQTT Client connection
const mqttClient = mqtt.connect('mqtt://192.168.54.235:1883');

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

const publicKey = fs.readFileSync('./keys/public.key');
// const payload = jwt.verify(msg.token, publicKey, { algorithms: ['RS256'] });


// When a WebSocket client connects
wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    // Initially mark user as not authenticated
    ws.isAuthenticated = false;

    // Listen to messages from client
    ws.on('message', (data) => {
        const msg = JSON.parse(data);

        // Step 1: Handle authentication first
        if (msg.action === 'auth') {
            try {
                const payload = jwt.verify(msg.token, publicKey, { algorithms: ['RS256'] });

                // If username is not 'kanji', reject the connection and close the WebSocket
                if (payload.username !== 'kanji') {
                    console.log('Unauthorized user:', payload.username);
                    ws.send(JSON.stringify({ error: 'Unauthorized user' }));
                    ws.close(); // Immediately close the WebSocket connection
                    return;
                }

                console.log('Verified user:', payload.username);
                ws.isAuthenticated = true;
                ws.send(JSON.stringify({ status: 'authenticated' }));

            } catch (err) {
                console.error('Invalid token');
                ws.send(JSON.stringify({ error: 'Authentication failed' }));
                ws.close(); // Close the WebSocket if token verification fails
            }
            return;
        }

        // Step 2: Block unauthenticated access
        if (!ws.isAuthenticated) {
            console.log('User is not authenticated');
            ws.send(JSON.stringify({ error: 'Not authenticated' }));
            ws.close(); // Close the WebSocket if the user is not authenticated
            return;
        }

        // Step 3: If authenticated, allow MQTT actions
        const { action, topic, message } = msg;

        if (action === 'subscribe') {
            mqttClient.subscribe(topic, (err) => {
                if (err) console.error('Subscribe error:', err);
                else console.log(`Subscribed to topic: ${topic}`);
            });
        } else if (action === 'publish') {
            mqttClient.publish(topic, message);
        }
    });

    // If the client doesn't send an auth action, close the connection immediately
    ws.on('open', () => {
        console.log('WebSocket opened');
    });

    ws.on('close', () => {
        console.log('WebSocket closed');
    });

});




// Start the server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
