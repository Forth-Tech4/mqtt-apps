

const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const mqttRoutes = require('./routes/mqttRoutes');
const { initWebSocket } = require('./websocket/wsHandler');
const cors = require('cors');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://mqttgimble.netlify.app",
    "https://mqttgimbletesting.netlify.app"
  ],
  credentials: true
}));

app.use('/', mqttRoutes);




initWebSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
