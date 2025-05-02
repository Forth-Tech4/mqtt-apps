const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));

// Secure MQTT Client connection (TLS + Cert Auth)
const mqttClient = mqtt.connect('mqtts://localhost:8883', {
  key: fs.readFileSync('./Cert/client.key'),
  cert: fs.readFileSync('./Cert/client.crt'),
  ca: fs.readFileSync('./Cert/ca.crt'),
  rejectUnauthorized: true
});

mqttClient.on('connect', () => {
  console.log('Connected to Mosquitto MQTT Broker (TLS)');
});

mqttClient.on('error', (err) => {
  console.error('MQTT Connection error:', err);
});

// Broadcast MQTT messages to WebSocket clients
mqttClient.on('message', (topic, message) => {
  const payload = JSON.stringify({ topic, message: message.toString() });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
});

// WebSocket connection
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
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

  ws.on('open', () => {
    console.log('WebSocket opened');
  });

  ws.on('close', () => {
    console.log('WebSocket closed');
  });
});

// Start server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
