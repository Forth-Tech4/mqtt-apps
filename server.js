const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const mqttBrokerUrl = 'mqtt://192.168.54.235:1883';

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.isMQTTAuthenticated = false;
    ws.isAuthInProgress = false;
    ws.subscribedTopics = {}; // Initialize subscribed topics for each client

    ws.on('message', (data) => {
        console.log('Received from client:', data);
        try {
            const msg = JSON.parse(data);
            console.log('Parsed message:', msg);

            if (msg.action === 'auth_check') {
                ws.send(JSON.stringify({ isAuthInProgress: ws.isAuthInProgress }));
                return;
            }

            if (msg.action === 'auth') {
                const { username, password } = msg;

                if (ws.isAuthInProgress) {
                    console.log('Authentication already in progress for this WebSocket.');
                    return;
                }

                ws.isAuthInProgress = true;
                console.log('Attempting MQTT connection for WebSocket...');
                const mqttClient = mqtt.connect(mqttBrokerUrl, { username, password });
                ws.mqttClient = mqttClient; // Store MQTT client

                mqttClient.on('connect', () => {
                    console.log('Successfully authenticated with MQTT broker for this WebSocket.');
                    ws.isMQTTAuthenticated = true;
                    ws.isAuthInProgress = false;
                    ws.send(JSON.stringify({ status: 'authenticated' }));

                    // Resubscribe to any topics if the client had subscribed before re-authentication
                    if (ws.subscribedTopics) {
                        Object.keys(ws.subscribedTopics).forEach(topic => {
                            mqttClient.subscribe(topic, (err) => {
                                if (err) console.error('Resubscribe error:', err);
                                else console.log(`Resubscribed to topic: ${topic}`);
                            });
                        });
                    }
                });

                mqttClient.on('error', (err) => {
                    console.error('MQTT Authentication error:', err);
                    ws.send(JSON.stringify({ error: 'MQTT Authentication failed' }));
                    ws.isAuthInProgress = false;
                    ws.close(); // Close WebSocket on MQTT authentication failure
                });

                mqttClient.on('message', (topic, message) => {
                    if (ws.isMQTTAuthenticated) {
                        const payload = JSON.stringify({ topic, message: message.toString() });
                        ws.send(payload);
                    }
                });
            } else if (ws.isMQTTAuthenticated) {
                const { action, topic, message } = msg;
                if (action === 'subscribe') {
                    if (ws.mqttClient) {
                        ws.mqttClient.subscribe(topic, (err) => {
                            if (err) {
                                console.error('Subscribe error:', err);
                                ws.send(JSON.stringify({ error: `Failed to subscribe to ${topic}: ${err.message}` }));
                            } else {
                                console.log(`Subscribed to topic: ${topic}`);
                                ws.subscribedTopics[topic] = true;
                            }
                        });
                    } else {
                        ws.send(JSON.stringify({ error: 'MQTT client not initialized.' }));
                    }
                } else if (action === 'publish') {
                    if (ws.mqttClient) {
                        ws.mqttClient.publish(topic, message);
                    } else {
                        ws.send(JSON.stringify({ error: 'MQTT client not initialized.' }));
                    }
                }
            } else {
                ws.send(JSON.stringify({ error: 'Not authenticated with MQTT broker.' }));
                ws.close(); // Close WebSocket if not authenticated and trying to perform actions
            }
        } catch (err) {
            console.error('Error handling WebSocket message:', err);
            ws.send(JSON.stringify({ error: 'Invalid message format.' }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket closed, disconnecting MQTT client for this session.');
        if (ws.mqttClient) {
            ws.mqttClient.end();
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (ws.mqttClient) {
            ws.mqttClient.end();
        }
    });
});

server.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});