const WebSocket = require('ws');
// Import the specific functions needed from mqttClient
const { publish, subscribe, isConnected, hadLastCertError } = require('../models/mqttClient');

let wss = null;

function initWebSocket(server) {
    wss = new WebSocket.Server({ server });
    console.log('WebSocket: Server initialized.');

    wss.on('connection', (ws) => {
        console.log('WebSocket: New client connected.');
        ws.subscribedTopics = new Set(); // Track topics per client

        // Check MQTT connection status before allowing full interaction
        if (!isConnected()) {
            const error = hadLastCertError()
                ? 'Certificate authentication failed. Check client.key, client.crt, or ca.crt.'
                : 'MQTT broker is not connected.';
            console.warn(`WebSocket: Rejecting connection due to MQTT status: ${error}`);
            ws.send(JSON.stringify({ type: 'error', message: error })); // Use 'type' for easier frontend parsing
            ws.close();
            return;
        }

        ws.on('message', (data) => {
            console.log('WebSocket: Received message from client:', data.toString());
            try {
                const msg = JSON.parse(data);

                if (msg.action === 'subscribe') {
                    // Store subscription for this specific WebSocket client
                    ws.subscribedTopics.add(msg.topic);
                    console.log(`WebSocket: Client subscribing to topic: ${msg.topic}`);
                    // MQTT client-level subscription (if not already subscribed by another WS client)
                    // It's generally better to let the MQTT client manage its subscriptions to avoid duplicates.
                    // The `subscribe` function from `mqttClient.js` will handle this.
                    subscribe(msg.topic);
                } else if (msg.action === 'publish') {
                    console.log(`WebSocket: Client publishing to topic: ${msg.topic}, message: ${msg.message}`);
                    // Use the centralized publish function from mqttClient
                    publish(msg.topic, msg.message);
                } else {
                    console.warn('WebSocket: Unknown action received:', msg.action);
                }
            } catch (e) {
                console.error('WebSocket: Error parsing message from client:', e.message);
                ws.send(JSON.stringify({ type: 'error', message: `Invalid message format: ${e.message}` }));
            }
        });

        ws.on('close', () => {
            console.log('WebSocket: Client disconnected.');
        });

        ws.on('error', (error) => {
            console.error('WebSocket: Client error:', error.message);
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
    console.log(`WebSocket: Broadcasting MQTT message to connected clients for topic: ${topic}`);

    wss.clients.forEach((client) => {
        // Ensure the client is open, has subscribedTopics, and at least one topic matches
        if (
            client.readyState === WebSocket.OPEN &&
            client.subscribedTopics &&
            [...client.subscribedTopics].some((sub) => topicMatches(sub, topic))
        ) {
            console.log(`WebSocket: Sending message to a client subscribed to a matching topic.`);
            client.send(payload);
        }
    });
}

module.exports = { initWebSocket, broadcast };