const mqtt = require('mqtt');
const fs = require('fs');

let mqttClient = null;
let isMqttConnected = false;
let lastCertError = false;

function connectWithCerts({ hostname, port, keyPath, certPath, caPath }, onConnect, onError, onMessage) {
  if (mqttClient) mqttClient.end(true);

  const mqttUrl = `mqtts://${hostname}:${port}`;
  mqttClient = mqtt.connect(mqttUrl, {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    ca: fs.readFileSync(caPath),
    rejectUnauthorized: true,
    reconnectPeriod: 0,
  });

  mqttClient.on('connect', () => {
    isMqttConnected = true;
    lastCertError = false;
    onConnect();
  });

  mqttClient.on('error', (err) => {
    isMqttConnected = false;
    lastCertError = true;
    onError(err);
  });

  mqttClient.on('message', (topic, message) => {
    onMessage(topic, message);
  });
}

module.exports = {
  connectWithCerts,
  getClient: () => mqttClient,
  isConnected: () => isMqttConnected,
  hadLastCertError: () => lastCertError,
};
