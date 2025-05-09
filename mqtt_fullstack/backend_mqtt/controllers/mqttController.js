const { connectWithCerts } = require('../models/mqttClient');
const path = require('path');

exports.uploadCerts = (req, res) => {
  const hostname = req.body.hostname || process.env.MQTT_HOST;
  const port = req.body.port || process.env.MQTT_PORT;
  const files = req.files;

  if (!hostname || !port) return res.json({ error: 'missing_host_or_port' });
  if (!files.clientKey || !files.clientCert || !files.caCert) return res.json({ error: 'cert_failed' });

  const keyPath = files.clientKey[0].path;
  const certPath = files.clientCert[0].path;
  const caPath = files.caCert[0].path;

  connectWithCerts(
    { hostname, port, keyPath, certPath, caPath },
    () => res.json({ status: 'connected' }),
    (err) => {
      console.error('❌ MQTT Error:', err.message);
      if (!res.headersSent) res.json({ error: 'cert_failed' });
    },
    (topic, message) => {
      const payload = JSON.stringify({ topic, message: message.toString() });
      require('../websocket/wsHandler').broadcast(payload);
    }
  );
};
