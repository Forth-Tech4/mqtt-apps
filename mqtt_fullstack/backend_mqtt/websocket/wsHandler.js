const WebSocket = require('ws');
const { getClient, isConnected, hadLastCertError } = require('../models/mqttClient');
let wss = null;
function initWebSocket(server) {
  wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    ws.subscribedTopics = new Set(); // Track topics per client
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
        ws.subscribedTopics.add(msg.topic);
        client.subscribe(msg.topic); // MQTT client-level subscription
      } else if (msg.action === 'publish') {
        client.publish(msg.topic, msg.message);
      }
    });
  });
}
function topicMatches(subscribedTopic, actualTopic) {
  if (subscribedTopic === actualTopic) return true;
  if (subscribedTopic.endsWith('/#')) {
    const prefix = subscribedTopic.slice(0, -2);
    return actualTopic.startsWith(prefix);
  }
  return false;
}
function broadcast(payload) {
  const { topic } = JSON.parse(payload);
  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.subscribedTopics &&
      [...client.subscribedTopics].some((sub) => topicMatches(sub, topic))
    ) {
      client.send(payload);
    }
  });
}
module.exports = { initWebSocket, broadcast };