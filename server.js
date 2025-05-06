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
let lastCertError = false;

// Handle cert uploads
app.post('/upload-certs', upload.fields([
  { name: 'clientKey' },
  { name: 'clientCert' },
  { name: 'caCert' }
]), (req, res) => {
  const files = req.files;

  if (!files.clientKey || !files.clientCert || !files.caCert) {
    return res.json({ error: 'cert_failed' });
  }

  const keyPath = files.clientKey[0].path;
  const certPath = files.clientCert[0].path;
  const caPath = files.caCert[0].path;

  try {
    if (mqttClient) mqttClient.end(true);

    mqttClient = mqtt.connect('mqtts://localhost:8883', {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
      ca: fs.readFileSync(caPath),
      rejectUnauthorized: true,
      reconnectPeriod: 0
    });

    const handleConnect = () => {
      isMqttConnected = true;
      lastCertError = false;
      console.log('✅ MQTT Connected with TLS certs');
      res.json({ status: 'connected' });

      mqttClient.off('connect', handleConnect);
      mqttClient.off('error', handleError);
    };

    const handleError = (err) => {
      isMqttConnected = false;
      lastCertError = true;
      console.error('❌ MQTT Error:', err.message);

      if (!res.headersSent) {
        res.json({ error: 'cert_failed' });
      }

      mqttClient.off('connect', handleConnect);
      mqttClient.off('error', handleError);
    };

    mqttClient.on('connect', handleConnect);
    mqttClient.on('error', handleError);

    mqttClient.on('message', (topic, message) => {
      const payload = JSON.stringify({ topic, message: message.toString() });
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    });
  } catch (e) {
    console.error('❌ Exception during cert processing:', e.message);
    if (!res.headersSent) {
      return res.json({ error: 'cert_failed' });
    }
  }
});

// WebSocket Bridge
wss.on('connection', (ws) => {
  if (!isMqttConnected) {
    if (lastCertError) {
      ws.send(JSON.stringify({ error: 'Certificate authentication failed. Check client.key, client.crt, or ca.crt.' }));
    } else {
      ws.send(JSON.stringify({ error: 'MQTT broker is not connected.' }));
    }
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
