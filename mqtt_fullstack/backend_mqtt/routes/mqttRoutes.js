// routes/mqttRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const mqttController = require('../controllers/mqttController');

// Configure multer to process all fields as text, not files.
// This means the certificate strings will be available directly in req.body.
const upload = multer(); // No dest needed for upload.none()

router.post('/upload-certs', upload.none(), mqttController.uploadCerts); // Changed to upload.none()

module.exports = router;