const express = require('express');
const app = express();
app.use(express.json());

app.post('/configure', (req, res) => {
  const { wifi_ssid, wifi_password } = req.body;

  console.log('📱 Received Config:', req.body);

  if (wifi_ssid === 'wrongssid' || wifi_password === 'wrongpass') {
    return res.status(400).json({
      success: false,
      message: "WiFi credentials are invalid"
    });
  }

  setTimeout(() => {
    res.json({
      success: true,
      message: 'Device configured successfully',
      received_config: req.body
    });
  }, 2000);
});


app.listen(8080, '0.0.0.0', () => {
  console.log('🔧 Device simulator running on http://localhost:8080');
});
