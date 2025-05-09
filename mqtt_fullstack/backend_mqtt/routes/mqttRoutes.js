const express = require('express');
const multer = require('multer');
const router = express.Router();
const mqttController = require('../controllers/mqttController');

const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
const upload = multer({ dest: uploadDir });

router.post('/upload-certs', upload.fields([
  { name: 'clientKey' },
  { name: 'clientCert' },
  { name: 'caCert' }
]), mqttController.uploadCerts);

module.exports = router;
