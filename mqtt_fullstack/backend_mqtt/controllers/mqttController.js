// controllers/mqttController.js
const { connectWithCerts } = require('../models/mqttClient');
const path = require('path');
const fs = require('fs');
const forge = require('node-forge');
const os = require('os');

exports.uploadCerts = async (req, res) => {
    const { hostname, port, clientId, clientKey, clientCert, caCert } = req.body;

    console.log('CertificateController: UploadCerts initiated.');

    if (!hostname || !port) {
        console.warn('CertificateController: Missing hostname or port.');
        return res.status(400).json({ error: 'missing_host_or_port', message: 'Host and port are required.' });
    }

    if (!clientKey || !clientCert || !caCert) {
        console.warn('CertificateController: Missing certificate string data in request body.');
        return res.status(400).json({ error: 'cert_failed', message: 'All certificate data (PEM strings) is required.' });
    }

    const tempDir = path.join(os.tmpdir(), 'mqtt_certs', clientId);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const keyPath = path.join(tempDir, 'client.key');
    const certPath = path.join(tempDir, 'client.crt');
    const caPath = path.join(tempDir, 'ca.crt');

    let cleanupFiles = [keyPath, certPath, caPath];

    try {
        fs.writeFileSync(keyPath, clientKey);
        fs.writeFileSync(certPath, clientCert);
        fs.writeFileSync(caPath, caCert);
        console.log('CertificateController: Temporary certificate files created.');

        connectWithCerts(
            { hostname, port: parseInt(port), keyPath, certPath, caPath, clientId },
            () => {
                console.log('CertificateController: MQTT client connection callback success.');
                res.json({ status: 'connected', clientId: clientId });
            },
            (err) => {
                console.error('CertificateController: MQTT connection error callback:', err.message);
                if (!res.headersSent) {
                    let errorType = 'cert_failed';
                    let errorMessage = 'Certificate authentication failed. Check your files or broker logs.';
                    if (err.message.includes('ECONNREFUSED')) {
                        errorMessage = 'Connection refused. Is the MQTT broker running and accessible?';
                    } else if (err.message.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') || err.message.includes('no start line') || err.message.includes('ERR_OSSL_PEM_NO_START_LINE')) {
                        errorMessage = 'Certificate verification failed. Check CA or client certificates. They might be malformed or incorrect.';
                    }
                    res.status(500).json({ error: errorType, message: errorMessage });
                }
            },
            (topic, message) => {
                const payload = JSON.stringify({ topic, message: message.toString() });
                require('../websocket/wsHandler').broadcast(payload);
            }
        );

    } catch (error) {
        console.error('CertificateController: Error creating temporary certificate files or during connection setup:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'file_write_failed', message: 'Failed to process certificate data on the server.' });
        }
    } finally {
        const cleanup = () => {
            console.log('CertificateController: Initiating temporary file cleanup...');
            cleanupFiles.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`CertificateController: Deleted temp file: ${filePath}`);
                    } catch (err) {
                        console.error(`CertificateController: Failed to delete temp file ${filePath}:`, err.message);
                    }
                }
            });
            try {
                if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
                    fs.rmdirSync(tempDir);
                    console.log(`CertificateController: Deleted temp directory: ${tempDir}`);
                }
            } catch (err) {
                console.error(`CertificateController: Failed to delete temp directory ${tempDir}:`, err.message);
            }
        };

        setTimeout(cleanup, 2000);
    }
};
