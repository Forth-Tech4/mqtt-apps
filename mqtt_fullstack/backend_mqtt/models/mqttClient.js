const mqtt = require('mqtt');
const fs = require('fs');

let mqttClient = null;
let isMqttConnected = false;
let lastCertError = false;

const DEFAULT_MQTT_SUBSCRIPTION_TOPIC = 'Forthtech/#';

function connectWithCerts({ hostname, port, keyPath, certPath, caPath }, onConnect, onError, onMessage) {
    // If an existing client exists, end it clean before creating a new one
    if (mqttClient) {
        console.log('MQTT: Ending existing MQTT client connection.');
        mqttClient.end(true, () => {
            console.log('MQTT: Existing MQTT client disconnected.');
            // DO NOT set mqttClient = null here.
            // The new mqttClient will be assigned below, overwriting this reference.
            // If you set it to null here, and the new connection is very fast,
            // you can hit a race condition where the 'connect' event fires
            // before the new mqttClient is assigned, but after the old one is nullified.
        });
        // Add a small delay or ensure the old client is fully ended before creating a new one,
        // although mqtt.connect usually handles this gracefully by creating a new instance.
        // For simplicity and to avoid race conditions, it's safer to just create a new client
        // and let the garbage collector handle the old one after it's ended.
    }

    const mqttUrl = `mqtts://${hostname}:${port}`;
    console.log(`MQTT: Attempting to connect to ${mqttUrl}`);

    // Assign the new MQTT client instance immediately
    mqttClient = mqtt.connect(mqttUrl, {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        ca: fs.readFileSync(caPath),
        rejectUnauthorized: true,
        reconnectPeriod: 0,
        clientId: 'Forthtech-Backend',
    });

    mqttClient.on('connect', () => {
        isMqttConnected = true;
        lastCertError = false;
        console.log('MQTT: Client connected successfully!');

        // Ensure mqttClient is not null before trying to subscribe
        // This check is a safeguard, but with the fix above, it should always be valid here.
        if (mqttClient) {
            mqttClient.subscribe(DEFAULT_MQTT_SUBSCRIPTION_TOPIC, (err) => {
                if (err) {
                    console.error(`MQTT: Error subscribing to default topic ${DEFAULT_MQTT_SUBSCRIPTION_TOPIC}:`, err);
                } else {
                    console.log(`MQTT: Successfully subscribed to default topic: ${DEFAULT_MQTT_SUBSCRIPTION_TOPIC}`);
                }
                onConnect(); // Call onConnect after attempting subscription
            });
        } else {
            console.error("MQTT: mqttClient is null on 'connect' event. This should not happen with the fix.");
            onConnect(); // Still call onConnect to avoid blocking the frontend
        }
    });

    mqttClient.on('error', (err) => {
        isMqttConnected = false;
        lastCertError = true;
        console.error('MQTT: Client error:', err.message);
        onError(err);
    });

    mqttClient.on('close', () => {
        isMqttConnected = false;
        console.log('MQTT: Client disconnected.');
        // If you want to explicitly null out the client on disconnect, do it here.
        // mqttClient = null; // Optional: can be set here if you want to explicitly clear it on client's self-close
    });

    mqttClient.on('reconnect', () => {
        console.log('MQTT: Client attempting to reconnect...');
    });

    mqttClient.on('offline', () => {
        console.log('MQTT: Client is offline.');
    });

    mqttClient.on('message', (topic, message) => {
        console.log(`MQTT: Received message -> Topic: ${topic}, Message: ${message.toString()}`);
        onMessage(topic, message);
    });
}

function publish(topic, message) {
    if (mqttClient && isMqttConnected) {
        mqttClient.publish(topic, message, {}, (err) => {
            if (err) {
                console.error(`MQTT: Failed to publish message to topic ${topic}:`, err);
            } else {
                console.log(`MQTT: Message published to topic: ${topic}`);
            }
        });
    } else {
        console.warn(`MQTT: Cannot publish, client not connected. Topic: ${topic}`);
    }
}

function subscribe(topic) {
    if (mqttClient && isMqttConnected) {
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.error(`MQTT: Failed to subscribe to topic ${topic}:`, err);
            } else {
                console.log(`MQTT: Successfully subscribed to topic: ${topic}`);
            }
        });
    } else {
        console.warn(`MQTT: Cannot subscribe, client not connected. Topic: ${topic}`);
    }
}

module.exports = {
    connectWithCerts,
    getClient: () => mqttClient,
    isConnected: () => isMqttConnected,
    hadLastCertError: () => lastCertError,
    publish,
    subscribe,
};