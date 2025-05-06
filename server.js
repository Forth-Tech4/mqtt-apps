// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

let mqttClient = null;
let isMqttConnected = false;

// Handle cert uploads
app.post('/upload-certs', upload.fields([
  { name: 'clientKey' },
  { name: 'clientCert' },
  { name: 'caCert' }
]), (req, res) => {
  const files = req.files;
  const keyPath = files.clientKey[0].path;
  const certPath = files.clientCert[0].path;
  const caPath = files.caCert[0].path;

  if (mqttClient) mqttClient.end();

  mqttClient = mqtt.connect('mqtts://localhost:8883', {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    ca: fs.readFileSync(caPath),
    rejectUnauthorized: true,
    reconnectPeriod: 0
  });

  mqttClient.on('connect', () => {
    isMqttConnected = true;
    console.log('✅ MQTT Connected with TLS certs');
  });

  mqttClient.on('error', (err) => {
    isMqttConnected = false;
    console.error('❌ MQTT Error:', err.message);
  });

  mqttClient.on('message', (topic, message) => {
    const payload = JSON.stringify({ topic, message: message.toString() });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });

  res.json({ status: 'Certificates uploaded and MQTT connected.' });
});

// WebSocket Bridge
wss.on('connection', (ws) => {
  if (!isMqttConnected) {
    ws.send(JSON.stringify({ error: 'MQTT broker is not connected.' }));
    ws.close();
    return;
  }

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    const { action, topic, message } = msg;

    if (action === 'subscribe') {
      mqttClient.subscribe(topic);
    } else if (action === 'publish') {
      mqttClient.publish(topic, message);
    }
  });
});

server.listen(3001, () => {
  console.log('🚀 Server running on http://localhost:3001');
});
