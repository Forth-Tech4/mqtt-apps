const { connectWithCerts } = require('../models/mqttClient');
const path = require('path');
const fs = require('fs');
const forge = require('node-forge');

exports.uploadCerts = (req, res) => {
    const { hostname, port ,clientId} = req.body;
    const files = req.files;

    console.log('CertificateController: UploadCerts initiated.');

    if (!hostname || !port) {
        console.warn('CertificateController: Missing hostname or port.');
        return res.status(400).json({ error: 'missing_host_or_port' }); 
    }
    if (!files.clientKey || !files.clientCert || !files.caCert) {
        console.warn('CertificateController: Missing certificate files.');
        return res.status(400).json({ error: 'cert_failed', message: 'All certificate files are required.' });
    }

    const keyPath = files.clientKey[0].path;
    const certPath = files.clientCert[0].path;
    const caPath = files.caCert[0].path;

    let cn = null;
    try {
        const pem = fs.readFileSync(certPath, 'utf8');
        const cert = forge.pki.certificateFromPem(pem);
        cn = cert.subject.getField('CN').value;
        console.log(`CertificateController: Extracted CN: ${cn}`);
    } catch (err) {
        console.error('CertificateController: Certificate CN extract failed:', err.message);
    }

    connectWithCerts(
        { hostname, port: parseInt(port), keyPath, certPath, caPath, clientId }, 
        () => {
            console.log('CertificateController: MQTT client connection callback success.');
            res.json({ status: 'connected', cn: cn || 'Forthtech' });
        },
        (err) => {
            console.error('CertificateController: MQTT connection error callback:', err.message);
            if (!res.headersSent) {
                let errorType = 'cert_failed';
                let errorMessage = 'Certificate authentication failed. Check your files or broker logs.';
                if (err.message.includes('ECONNREFUSED')) {
                    errorMessage = 'Connection refused. Is the MQTT broker running and accessible?';
                } else if (err.message.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
                    errorMessage = 'Certificate verification failed. Check CA or client certificates.';
                }
                res.status(500).json({ error: errorType, message: errorMessage });
            }
        },
        (topic, message) => {
            const payload = JSON.stringify({ topic, message: message.toString() });
            require('../websocket/wsHandler').broadcast(payload);
        }
    );
};