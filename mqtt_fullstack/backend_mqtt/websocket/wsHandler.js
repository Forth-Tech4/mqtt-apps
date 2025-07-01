const WebSocket = require('ws');
const { publish, subscribe, isConnected, hadLastCertError } = require('../models/mqttClient');

let wss = null;

function initWebSocket(server) {
    wss = new WebSocket.Server({ server });
    console.log('WebSocket: Server initialized.');

    wss.on('connection', (ws) => {
        console.log('WebSocket: New client connected.');
        ws.subscribedTopics = new Set(); 
        if (!isConnected()) {
            const error = hadLastCertError()
                ? 'Certificate authentication failed. Check client.key, client.crt, or ca.crt.'
                : 'MQTT broker is not connected.';
            console.warn(`WebSocket: Rejecting connection due to MQTT status: ${error}`);
            ws.send(JSON.stringify({ type: 'error', message: error })); 
            ws.close();
            return;
        }

        ws.on('message', (data) => {
            console.log('WebSocket: Received message from client:', data.toString());
            try {
                const msg = JSON.parse(data);

                if (msg.action === 'subscribe') {
             
                    ws.subscribedTopics.add(msg.topic);
                    console.log(`WebSocket: Client subscribing to topic: ${msg.topic}`);
                    subscribe(msg.topic);
                } else if (msg.action === 'publish') {
                    console.log(`WebSocket: Client publishing to topic: ${msg.topic}, message: ${msg.message}`);
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
        // E client is open, has subscribedTopics, and at least one topic matches
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