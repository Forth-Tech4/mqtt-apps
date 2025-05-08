const WebSocket = require('ws');
const { getClient, isConnected, hadLastCertError } = require('../models/mqttClient');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    if (!isConnected()) {
      const error = hadLastCertError()
        ? 'Certificate authentication failed. Check client.key, client.crt, or ca.crt.'
        : 'MQTT broker is not connected.';
      ws.send(JSON.stringify({ error }));
      ws.close();
      return;
    }

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      const client = getClient();
      if (!client) return;

      if (msg.action === 'subscribe') {
        client.subscribe(msg.topic);
      } else if (msg.action === 'publish') {
        client.publish(msg.topic, msg.message);
      }
    });
  });
}

function broadcast(payload) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

module.exports = { initWebSocket, broadcast };
